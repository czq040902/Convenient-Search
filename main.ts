import { serveDir } from "jsr:@std/http/file-server";

// 定义数据结构类型，这在 TypeScript 中是个好习惯
interface Website {
  name: string;
  url: string;
  description: string;
  tags: string[];
}

let websites: Website[] = [];

// 尝试加载 JSON 数据
try {
  const jsonData = await Deno.readTextFile("./data.json");
  websites = JSON.parse(jsonData);
  console.log(`✅ 成功加载 ${websites.length} 条网址数据。`);
} catch (error) {
  console.error("❌ 加载 data.json 文件失败:", error);
  // 即使加载失败，服务也可以继续运行，只是搜索结果会为空
}

// 启动服务
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname;

  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);

  // API 路由：处理搜索请求
  if (pathname === "/api/search") {
    const query = url.searchParams.get("q")?.toLowerCase() || "";

    if (!query) {
      // 如果查询为空，返回空数组
      return new Response(JSON.stringify([]), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const results = websites.filter((site) =>
      site.name.toLowerCase().includes(query) ||
      site.description.toLowerCase().includes(query) ||
      site.tags.some((tag) => tag.toLowerCase().includes(query))
    );

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // 静态文件服务：托管 public 目录下的所有文件
  // 这会让用户可以通过浏览器访问 index.html, style.css, script.js
  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "", // 访问 http://localhost:8000/ 会直接映射到 public 目录
    showDirListing: true,
    enableCors: true,
  });
}, { port: 8000 });

console.log("🚀 服务已启动，请访问 http://localhost:8000");
