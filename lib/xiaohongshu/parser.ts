import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { NoteData, CSVParseResult } from '@/types/xiaohongshu';

/**
 * 支持的文件类型
 */
export type SupportedFileType = 'csv' | 'xlsx' | 'xls';

// 标准化字段名映射（支持小红书导出的各种列名）
const FIELD_MAPPINGS: Record<string, readonly string[]> = {
  title: ['标题', 'title', '笔记标题', '笔记名称', 'content_title', 'note_title'],
  content: ['内容', 'content', '正文', '笔记内容', 'note_content'],
  likes: ['点赞', 'likes', '点赞数', '赞', 'heart', 'liked_count'],
  comments: ['评论', 'comments', '评论数', '评论量', 'comment', 'reply', 'comment_count'],
  shares: ['分享', 'shares', '分享数', '转发', 'share', 'share_count'],
  views: ['曝光', 'views', '浏览量', '阅读量', 'view', 'read_count', 'play_count', '曝光数', '观看量'],
  collects: ['收藏', 'collects', '收藏数', 'collect', 'collect_count', 'save_count'],
  createTime: ['发布时间', 'create_time', 'date', 'time', 'created_at', '首次发布时间'],
  tags: ['标签', 'tags', 'tag', '话题'],
  category: ['分类', 'category', '类目', '笔记分类', '体裁'],
  author: ['作者', 'author', '博主', 'user', 'nickname'],
  fans: ['涨粉', 'fans', '粉丝', 'followers', '涨粉数'],
  duration: ['人均观看时长', 'duration', '时长'],
};

/**
 * 获取文件类型
 */
export function getFileType(file: File): SupportedFileType {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return 'xlsx';
  return 'csv';
}

/**
 * 清洗和标准化数据
 * 处理常见的格式问题，如第一列是序号
 */
function cleanAndNormalizeData(rawData: Record<string, unknown>[], columns: string[]): NoteData[] {
  // 检测第一列是否是序号列
  const firstCol = columns[0]?.toLowerCase();
  const isIndexColumn =
    firstCol === '#' ||
    firstCol === 'id' ||
    firstCol === '序号' ||
    firstCol === 'index' ||
    firstCol === 'no' ||
    !isNaN(Number(rawData[0]?.[columns[0]]));

  // 如果第一列是序号，跳过它
  const dataColumns = isIndexColumn ? columns.slice(1) : columns;

  return rawData.map((row, index) => {
    const normalizedRow: Record<string, unknown> = {};

    // 构建列名到原始列名的映射（加速查找）
    const columnMap = dataColumns.reduce<Record<string, string>>((map, colName) => {
      map[colName.toLowerCase().trim()] = colName;
      return map;
    }, {});

    // 映射原始字段到标准化字段
    for (const [standardField, possibleNames] of Object.entries(FIELD_MAPPINGS)) {
      const matchedName = possibleNames.find((name) => columnMap[name.toLowerCase()] !== undefined);
      if (matchedName) {
        normalizedRow[standardField] = row[columnMap[matchedName.toLowerCase()]];
      }
    }

    // 处理 tags 字段（可能是数组或逗号分隔的字符串）
    if (normalizedRow.tags) {
      if (Array.isArray(normalizedRow.tags)) {
        // 已经是数组，保持不变
      } else if (typeof normalizedRow.tags === 'string') {
        // 逗号分隔的字符串，转为数组
        normalizedRow.tags = normalizedRow.tags
          .split(/[,，]/)
          .map((t: string) => t.trim())
          .filter(Boolean);
      }
    }

    // 转换数值字段
    const numericFields = ['likes', 'comments', 'shares', 'views', 'collects', 'fans'];
    for (const field of numericFields) {
      const value = normalizedRow[field];
      if (value === undefined || value === null || value === '') {
        normalizedRow[field] = 0;
      } else if (typeof value === 'string') {
        // 移除逗号和空格，转换为数字
        normalizedRow[field] = parseFloat(value.replace(/[,，\s]/g, '')) || 0;
      } else {
        normalizedRow[field] = Number(value) || 0;
      }
    }

    return {
      ...normalizedRow,
      id: String(index + 1),
    } as NoteData;
  });
}

/**
 * 解析 Excel/xlsx 文件
 * @param file - Excel 文件对象
 * @returns 解析结果
 */
export async function parseExcel(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });

        // 获取第一个工作表
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 使用数组格式获取数据（header: 1）
        const rawDataAsArrays = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
        }) as unknown[][];

        if (rawDataAsArrays.length === 0) {
          resolve({
            success: false,
            data: [],
            columns: [],
            rowCount: 0,
            error: 'Empty sheet',
          });
          return;
        }

        console.log('[parseExcel] Total rows:', rawDataAsArrays.length);
        console.log('[parseExcel] First row:', rawDataAsArrays[0]);

        const firstRow = rawDataAsArrays[0] || [];
        const secondRow = rawDataAsArrays[1] || [];

        // 检测是否是合并单元格格式
        const hasMergedHeader = firstRow.some(
          (cell) =>
            typeof cell === 'string' &&
            (cell.includes('最多导出') || cell.includes('导出') || cell.includes('排序后'))
        );

        let actualColumns: string[];
        let dataRows: Record<string, unknown>[];

        if (hasMergedHeader && rawDataAsArrays.length >= 2) {
          console.log('[parseExcel] Detected merged header format');

          // 使用第二行作为列名
          actualColumns = secondRow.map((cell) => String(cell || ''));

          // 使用第三行及之后作为数据
          const rawData = rawDataAsArrays.slice(2);

          // 将数组数据转换为对象格式
          dataRows = rawData.map((row) => {
            const obj: Record<string, unknown> = {};
            actualColumns.forEach((colName, index) => {
              obj[colName] = row[index];
            });
            return obj;
          });

          console.log('[parseExcel] Actual columns:', actualColumns);
          console.log('[parseExcel] Data rows count:', dataRows.length);
        } else {
          // 标准格式：使用默认的 JSON 转换
          const rawData = XLSX.utils.sheet_to_json(worksheet, {
            defval: '',
            raw: false,
            dateNF: 'yyyy-mm-dd',
          }) as Record<string, unknown>[];

          actualColumns = Object.keys(rawData[0] || {});
          dataRows = rawData;
        }

        const cleanedData = cleanAndNormalizeData(dataRows, actualColumns);

        // 过滤掉标题行（如果数据中包含标题描述）
        const filteredData = cleanedData.filter((row) => {
          const title = String(row.title || '');
          if (title.includes('请了个AI') || title.includes('claude code')) {
            return true; // 保留实际数据
          }
          // 如果是空数据或全是0，跳过
          if (row.views === 0 && row.likes === 0 && !title) {
            return false;
          }
          return true;
        });

        resolve({
          success: true,
          data: filteredData,
          columns: actualColumns,
          rowCount: filteredData.length,
        });
      } catch (error) {
        resolve({
          success: false,
          data: [],
          columns: [],
          rowCount: 0,
          error: error instanceof Error ? error.message : 'Failed to parse Excel file',
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        columns: [],
        rowCount: 0,
        error: 'Failed to read file',
      });
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * 解析 CSV 文件
 * @param file - CSV 文件对象
 * @returns 解析结果
 */
export async function parseCSV(file: File): Promise<CSVParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          if (results.data.length === 0) {
            resolve({
              success: false,
              data: [],
              columns: results.meta.fields || [],
              rowCount: 0,
              error: 'Empty file',
            });
            return;
          }

          const columns = results.meta.fields || [];
          const cleanedData = cleanAndNormalizeData(results.data as Record<string, unknown>[], columns);

          resolve({
            success: true,
            data: cleanedData,
            columns,
            rowCount: cleanedData.length,
          });
        } catch (error) {
          resolve({
            success: false,
            data: [],
            columns: results.meta.fields || [],
            rowCount: 0,
            error: error instanceof Error ? error.message : 'Parse error',
          });
        }
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          columns: [],
          rowCount: 0,
          error: error.message,
        });
      },
    });
  });
}

/**
 * 解析 CSV 字符串
 * @param csvString - CSV 字符串
 * @returns 解析结果
 */
export function parseCSVString(csvString: string): CSVParseResult {
  const results = Papa.parse(csvString, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: 'greedy',
  });

  if (results.data.length === 0) {
    return {
      success: false,
      data: [],
      columns: results.meta.fields || [],
      rowCount: 0,
      error: 'Empty content',
    };
  }

  const columns = results.meta.fields || [];
  const cleanedData = cleanAndNormalizeData(results.data as Record<string, unknown>[], columns);

  return {
    success: true,
    data: cleanedData,
    columns,
    rowCount: cleanedData.length,
  };
}

/**
 * 通用文件解析函数（自动检测格式）
 * @param file - 文件对象
 * @returns 解析结果
 */
export async function parseFile(file: File): Promise<CSVParseResult> {
  const fileType = getFileType(file);

  switch (fileType) {
    case 'xlsx':
      return parseExcel(file);
    default:
      return parseCSV(file);
  }
}

/**
 * 格式化数字
 * @param num - 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * 计算互动率
 * @param note - 笔记数据
 * @returns 互动率百分比
 */
export function calculateEngagementRate(note: NoteData): number {
  const interactions = (note.likes || 0) + (note.comments || 0) + (note.shares || 0) + (note.collects || 0);
  const views = note.views || 0;
  if (views === 0) return 0;
  return (interactions / views) * 100;
}
