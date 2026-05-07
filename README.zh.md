# Cloud-Init NoCloud 配置生成器

[English Version](./README.md)

一个专业的 Web 化工具，旨在为 Hyper-V 和 VMware 等虚拟机环境生成符合 `NoCloud` 标准的 ISO 配置镜像。

## 🚀 功能特性

- **专业 Web 界面**: 使用 React 和 TailwindCSS 构建的现代、交互式界面。
- **多语言支持**: 自动检测浏览器语言（中/英），并支持手动切换及持久化存储。
- **用户管理**: 
  - 深度 **Root** 用户控制（密码、SSH 公钥、SSH 密码登录开关）。
  - 普通用户创建，支持 sudo 权限和 SSH 公钥配置。
- **SSH 配置**: 强大的 SSH 密码认证支持，针对 Ubuntu 24.04+ 和 AlmaLinux 9+ 提供了强制覆盖策略，确保 100% 可用。
- **区域设置**: 级联式的时区选择（大区 > 城市）。
- **网络配置**: 支持 DHCP v4 和 静态 IPv4（地址、网关、DNS）。
- **Instance ID 生成**: 集成 UUID v4 随机生成按钮，快速设置唯一实例 ID。
- **广泛的系统支持**: 兼容 Ubuntu 22.04+、RHEL/AlmaLinux/Rocky Linux 8+ 及其他支持 NoCloud 数据源的环境。
- **Docker 化**: 基于多阶段构建的单容器部署方案。

## 🛠️ 快速开始

### 前提条件

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 使用 Docker Compose 运行

在项目根目录下执行以下命令：

```bash
docker-compose up --build
```

应用启动后，可以通过以下地址访问：**[http://localhost:8000](http://localhost:8000)**

## 📦 项目结构

- `backend/`: 基于 FastAPI 的 YAML 和 ISO 生成后端。
- `frontend/`: 具备国际化支持的 React 前端。
- `Dockerfile`: 合并应用的多阶段构建文件。
- `docker-compose.yml`: 单容器服务的编排配置文件。

## ⚖️ 许可

本项目采用 [Apache License 2.0](./LICENSE) 许可协议。

**注意**：本项目的所有代码及文档全部由 **Gemini CLI** 生成。
