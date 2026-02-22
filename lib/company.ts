import { getDb } from "@/lib/db";

export type Company = {
  id: number;
  name: string;
  slug: string;
  brand_color: string;
  logo_url: string | null;
};

export async function getCompanyBySlug(slug: string): Promise<Company | null> {
 const db = await getDb();

const result = await db
  .request()
  .input("slug", slug)
  .query<Company>(`
    SELECT TOP 1
      id,
      name,
      slug,
      brand_color,
      logo_url
    FROM Athena_app.dbo.companies
    WHERE slug = @slug
  `);

  return result.recordset[0] ?? null;
}
