import { Client } from "@notionhq/client";

export default async function handler(req, res) {
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    const db = process.env.DATABASE_ID;

    const mode = req.query.mode || "month";
    const now = new Date();

    // Build date filter
    let start, end;

    if (mode === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    } else {
        start = new Date(now.getFullYear(), 0, 1).toISOString();
        end = new Date(now.getFullYear() + 1, 0, 1).toISOString();
    }

    // Query database
    const response = await notion.databases.query({
        database_id: db,
        filter: {
            and: [
                {
                    property: "Date",
                    date: { on_or_after: start }
                },
                {
                    property: "Date",
                    date: { before: end }
                }
            ]
        }
    });

    // Count categories
    const counts = {};

    response.results.forEach(page => {
        const prop = page.properties["Overall perspective"];
        if (!prop || prop.select == null) return;
        const label = prop.select.name;
        counts[label] = (counts[label] || 0) + 1;
    });

    res.status(200).json(counts);
}
