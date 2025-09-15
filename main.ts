import { serveDir } from "@std/http/file-server";

interface DataEntry {
  name: string;
  url?: string;
  code?: string;
  tags: string[];
}

let database: DataEntry[] = [];
const DATA_FILE_PATH = "./data.json";

// 封装一个加载数据的函数
async function loadDatabase() {
  try {
    const jsonData = await Deno.readTextFile(DATA_FILE_PATH);
    database = JSON.parse(jsonData);
    console.log(`✅ Successfully loaded ${database.length} data entries.`);
  } catch (error) {
    console.error("❌ Failed to load data.json:", error);
    // 如果文件不存在，可以初始化为空数组
    if (error instanceof Deno.errors.NotFound) {
      database = [];
    }
  }
}

// 初始加载
await loadDatabase();

Deno.serve({ port: 8000 }, async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // API 路由: 搜索
  if (pathname === "/api/search" && req.method === "GET") {
    // ... (这部分逻辑保持不变) ...
    const query = url.searchParams.get("q")?.toLowerCase() || "";
    if (!query) {
      return new Response("[]", {
        headers: { "Content-Type": "application/json" },
      });
    }
    const results = database.filter((entry) =>
      entry.name.toLowerCase().includes(query) ||
      entry.code?.toLowerCase().includes(query) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query))
    );
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- 新增 API 路由: 添加数据 ---
  if (pathname === "/api/add" && req.method === "POST") {
    try {
      const newEntry: DataEntry = await req.json();

      // 基本的数据验证
      if (!newEntry.name || !newEntry.tags || newEntry.tags.length === 0) {
        return new Response(
          JSON.stringify({ error: "Name and tags are required." }),
          { status: 400 },
        );
      }

      // 重新读取文件，确保数据最新，防止并发问题
      await loadDatabase();

      // 添加新条目到数组
      database.push(newEntry);

      // 将更新后的整个数组写回文件
      // JSON.stringify 的第三个参数 2 是为了美化格式，方便手动查看
      await Deno.writeTextFile(
        DATA_FILE_PATH,
        JSON.stringify(database, null, 2),
      );

      console.log(`💾 Data saved. Total entries: ${database.length}`);
      return new Response(JSON.stringify({ success: true, entry: newEntry }), {
        status: 201,
      });
    } catch (error) {
      console.error("❌ Error adding entry:", error);
      return new Response(
        JSON.stringify({ error: "Failed to process request." }),
        { status: 500 },
      );
    }
  }

  // 静态文件服务 (保持不变)
  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});

console.log("🚀 Server running at http://localhost:8000");
