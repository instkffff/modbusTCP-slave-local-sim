import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import Database from 'better-sqlite3'; // 引入原生 SQLite 驱动，完美支持 WAL 自动合并

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function startHttpServer(host = '0.0.0.0', port = 20000, rootDir = __dirname) {
    const server = http.createServer((req, res) => {
        let filePath = (req.url === '/' || req.url === './') ? './sqlite.html' : req.url;
        filePath = path.join(rootDir, filePath);

        if (!filePath.startsWith(rootDir)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
        }[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(data);
        });
    });

    // 绑定 WebSocket 服务，复用同一个 HTTP 端口
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws) => {
        console.log('客户端已通过 WebSocket 连接');

        // 封装发送数据库的逻辑（完美解决 WAL 无法读取最新数据的问题）
        const sendDatabase = () => {
            const dbPath = path.join(rootDir, './sqlite', 'control.db');
            try {
                if (fs.existsSync(dbPath)) {
                    // 以只读、安全的方式打开数据库（better-sqlite3 会自动去读 control.db-wal 中的最新内容）
                    const db = new Database(dbPath, { readonly: true, fileMustExist: true });
                    
                    // 将合并后的最新数据库状态序列化为标准的 Buffer
                    const buffer = db.serialize();
                    
                    // 用完立刻关闭数据库连接，释放文件锁
                    db.close();

                    // 通过 WS 发送二进制数据给前端
                    ws.send(buffer);
                } else {
                    console.warn('数据库文件不存在:', dbPath);
                }
            } catch (e) {
                console.error('读取或序列化 WAL 数据库错误:', e);
            }
        };

        // 客户端连接成功后立即发送一次最新数据库
        sendDatabase();

        // 监听客户端的消息（前端点手动刷新时触发）
        ws.on('message', (message) => {
            if (message.toString() === 'get_db') {
                sendDatabase();
            }
        });
    });

    server.listen(port, host, () => {
        console.log(`HTTP & WS server running at http://${host}:${port}/`);
        console.log(`Serving files from: ${rootDir}`);
    });

    return server;
}

export { startHttpServer };