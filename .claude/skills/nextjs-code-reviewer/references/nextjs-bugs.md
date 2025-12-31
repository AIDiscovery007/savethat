# Next.js 16 Common Bugs and Fixes

## Server/Client Component Issues

### Bug: Server Component using browser-only APIs

```typescript
// ❌ Wrong - Server Component using window
'use server'
export async function getData() {
  return window.localStorage.getItem('data') // Error!
}

// ✅ Correct - Check for browser environment
'use server'
export async function getData() {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('data')
  }
  return null
}
```

### Bug: Missing 'use client' for interactivity

```typescript
// ❌ Wrong - Click handler in Server Component
export default function Button({ onClick }) {
  return <button onClick={onClick}>Click</button> // Error!
}

// ✅ Correct - Add 'use client'
'use client'
export default function Button({ onClick }) {
  return <button onClick={onClick}>Click</button>
}
```

## useEffect Issues

### Bug: Missing dependencies

```typescript
// ❌ Wrong - Missing dependency
useEffect(() => {
  fetchData(userId)
}, []) // Error: userId is missing!

// ✅ Correct - Include all dependencies
useEffect(() => {
  fetchData(userId)
}, [userId])
```

### Bug: Stale state in useEffect

```typescript
// ❌ Wrong - Using stale state
useEffect(() => {
  console.log(count) // Always logs 0!
}, [])

// ✅ Correct - Add count to dependencies
useEffect(() => {
  console.log(count)
}, [count])
```

## Hydration Issues

### Bug: Different content on server/client

```typescript
// ❌ Wrong - Date differs between server and client
const date = new Date().toLocaleDateString()

// ✅ Correct - Use useEffect to set on client only
'use client'
const [date, setDate] = useState('')

useEffect(() => {
  setDate(new Date().toLocaleDateString())
}, [])
```

### Bug: Random values causing hydration mismatch

```typescript
// ❌ Wrong - Random ID changes on hydration
const id = Math.random().toString(36)

// ✅ Correct - Use stable ID
const id = useId() // or a stable generated ID
```

## Async/Await in Components

### Bug: Async component without Suspense

```typescript
// ❌ Wrong - Async Server Component without Suspense
export default async function Page() {
  const data = await fetchData()
  return <div>{data.title}</div>
}

// ✅ Correct - Wrap in Suspense
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <DataComponent />
    </Suspense>
  )
}
```

## Server Actions

### Bug: Not marking functions as async

```typescript
// ❌ Wrong - Server Action without async
'use server'
function createUser(formData: FormData) { // Error!
  db.create(formData)
}

// ✅ Correct - Add async
'use server'
async function createUser(formData: FormData) {
  await db.create(formData)
}
```

## Dynamic Routes

### Bug: Missing generateStaticParams

```typescript
// ❌ Wrong - Dynamic route without static generation
export default function Post({ params }: { params: { id: string } }) {
  return <div>Post {params.id}</div>
}

// ✅ Correct - Add generateStaticParams for static export
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ id: post.id }))
}
```
