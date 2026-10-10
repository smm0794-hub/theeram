// Supabase (PostgREST) caps every response at 1000 rows by default, so a plain
// `.select()` silently stops at 1000 and totals look "stuck". This walks the
// table page by page until it runs out, so analytics always see every row.
//
// Usage:
//   const rows = await fetchAll((from, to) =>
//     db.from('property_views').select('*').order('viewed_at', { ascending: false }).order('id').range(from, to)
//   )
const PAGE_SIZE = 1000

export async function fetchAll(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: { message: string } | null }>
): Promise<any[]> {
  const out: any[] = []
  for (let from = 0; ; ) {
    const { data, error } = await makeQuery(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const rows = data ?? []
    if (rows.length === 0) break
    out.push(...rows)
    from += rows.length // advance by what we actually got, in case the server caps lower than PAGE_SIZE
  }
  return out
}
