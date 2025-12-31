# TypeScript Error Fixes

## `any` Type Issues

```typescript
// ❌ Wrong
function processData(data: any) {
  return data.name
}

// ✅ Correct - Use proper types
interface User {
  name: string
  age: number
}

function processData(data: User) {
  return data.name
}
```

## Type Inference Issues

```typescript
// ❌ Wrong - Missing return type
async function fetchData() {
  return fetch('/api/data').then(r => r.json())
}

// ✅ Correct - Add return type
async function fetchData(): Promise<UserData> {
  return fetch('/api/data').then(r => r.json())
}
```

## Event Handler Types

```typescript
// ❌ Wrong - Missing event type
function handleClick(event) {
  console.log(event.target)
}

// ✅ Correct - Use proper event type
function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
  console.log(event.currentTarget)
}
```

## FormData Handling

```typescript
// ❌ Wrong - Any type for form data
async function submit(formData: any) {
  const name = formData.get('name')
}

// ✅ Correct - Use FormData type
async function submit(formData: FormData) {
  const name = formData.get('name') as string
}
```

## Optional Properties

```typescript
// ❌ Wrong - Not handling undefined
function greet(props: { name: string; age?: number }) {
  return `Age: ${props.age.toString()}` // Error!
}

// ✅ Correct - Use optional chaining or nullish coalescing
function greet(props: { name: string; age?: number }) {
  return `Age: ${props.age?.toString() ?? 'unknown'}`
}
```

## Generic Functions

```typescript
// ❌ Wrong - Using any for generic operations
function getFirst(arr: any[]) {
  return arr[0]
}

// ✅ Correct - Use generics
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0]
}
```
