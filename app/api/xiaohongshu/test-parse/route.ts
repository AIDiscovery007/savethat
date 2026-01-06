import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import type { NoteData } from '@/types/xiaohongshu';

/**
 * 清洗和标准化数据（服务器端版本）
 */
function cleanAndNormalizeData(rawData: Record<string, unknown>[], columns: string[]): NoteData[] {
  const firstCol = columns[0]?.toLowerCase();
  const isIndexColumn =
    firstCol === '#' ||
    firstCol === 'id' ||
    firstCol === '序号' ||
    firstCol === 'index' ||
    firstCol === 'no' ||
    !isNaN(Number(rawData[0]?.[columns[0]]));

  const dataColumns = isIndexColumn ? columns.slice(1) : columns;

  return rawData.map((row, index) => {
    const normalizedRow: Record<string, unknown> = {};

    const fieldMappings: Record<string, string[]> = {
      title: ['标题', 'title', '笔记标题', '笔记名称', 'content_title', 'note_title', '笔记标题'],
      content: ['内容', 'content', '正文', '笔记内容', 'note_content'],
      likes: ['点赞', 'likes', '点赞数', '赞', 'heart', 'liked_count', '点赞数'],
      comments: ['评论', 'comments', '评论数', '评论量', 'comment', 'reply', 'comment_count', '评论数'],
      shares: ['分享', 'shares', '分享数', '转发', 'share', 'share_count', '分享数'],
      views: ['曝光', 'views', '浏览量', '阅读量', 'view', 'read_count', 'play_count', '曝光数', '观看量'],
      collects: ['收藏', 'collects', '收藏数', 'collect', 'collect_count', 'save_count', '收藏数'],
      createTime: ['发布时间', 'create_time', '发布时间', 'date', 'time', 'created_at', '首次发布时间'],
      tags: ['标签', 'tags', 'tag', '话题'],
      category: ['分类', 'category', '类目', '笔记分类', '体裁'],
      author: ['作者', 'author', '博主', 'user', 'nickname'],
      fans: ['涨粉', 'fans', '粉丝', 'followers', '涨粉数'],
      duration: ['人均观看时长', 'duration', '时长', '人均观看时长'],
    };

    for (const [standardField, possibleNames] of Object.entries(fieldMappings)) {
      for (const colName of dataColumns) {
        const normalizedColName = colName.toLowerCase().trim();
        if (possibleNames.some((name) => normalizedColName.includes(name.toLowerCase()))) {
          normalizedRow[standardField] = row[colName];
          break;
        }
      }
    }

    const numericFields = ['likes', 'comments', 'shares', 'views', 'collects', 'fans'];
    for (const field of numericFields) {
      const value = normalizedRow[field];
      if (value === undefined || value === null || value === '') {
        normalizedRow[field] = 0;
      } else if (typeof value === 'string') {
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
 * 测试 xlsx 解析 API（服务器端版本）
 * POST /api/xiaohongshu/test-parse
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
      });
    }

    console.log('[test-parse] Received file:', file.name, 'size:', file.size);

    // 读取文件为 ArrayBuffer（服务器端）
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // 先获取数组格式数据来分析结构
    const rawDataAsArrays = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
    }) as unknown[][];

    if (rawDataAsArrays.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Empty sheet',
      });
    }

    console.log('[test-parse] Total rows:', rawDataAsArrays.length);
    console.log('[test-parse] First row:', rawDataAsArrays[0]);
    console.log('[test-parse] Second row:', rawDataAsArrays[1]);

    // 检测是否是合并单元格格式
    const firstRow = rawDataAsArrays[0] || [];
    const secondRow = rawDataAsArrays[1] || [];
    const hasMergedHeader = firstRow.some(
      (cell) =>
        typeof cell === 'string' &&
        (cell.includes('最多导出') || cell.includes('导出') || cell.includes('排序后'))
    );

    let actualColumns: string[];
    let dataRows: Record<string, unknown>[];

    if (hasMergedHeader && rawDataAsArrays.length >= 2) {
      console.log('[test-parse] Detected merged header format');

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

      console.log('[test-parse] Actual columns:', actualColumns);
      console.log('[test-parse] Data rows count:', dataRows.length);
    } else {
      // 标准格式
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false,
        dateNF: 'yyyy-mm-dd',
      }) as Record<string, unknown>[];

      actualColumns = Object.keys(rawData[0] || {});
      dataRows = rawData;
    }

    const cleanedData = cleanAndNormalizeData(dataRows, actualColumns);

    // 过滤空数据
    const filteredData = cleanedData.filter((row) => {
      const title = String(row.title || '');
      if (title && (row.views > 0 || row.likes > 0)) return true;
      return false;
    });

    console.log('[test-parse] Parse result:', {
      success: true,
      rowCount: filteredData.length,
      columns: actualColumns,
    });

    const previewData = filteredData.slice(0, 3).map((note) => ({
      id: note.id,
      title: note.title,
      likes: note.likes,
      comments: note.comments,
      views: note.views,
    }));

    return NextResponse.json({
      success: true,
      rowCount: filteredData.length,
      columns: actualColumns,
      previewData,
    });
  } catch (error) {
    console.error('[test-parse] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
