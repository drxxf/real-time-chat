# 使用官方Node.js运行时作为基础镜像
FROM node:20-alpine
 
# 设置工作目录为/app
WORKDIR /app
 
# 将应用的依赖文件复制到容器中
COPY package.json ./
 
# 安装应用的所有依赖
RUN npm config set registry https://registry.npm.taobao.org && \
    npm install

# 复制应用源代码到容器中
COPY . .
 
# 容器对外暴露的端口号
EXPOSE 3000
 
# 在容器启动时运行应用
CMD ["node", "server.js"]
