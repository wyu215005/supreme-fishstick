# Linux 命令速查手册

> 按使用场景分类，仅保留命令名称与中文作用。

## 01 文件与目录操作

| 命令 | 中文作用 |
|---|---|
| `ls` | 列出目录内容 |
| `pwd` | 显示当前目录 |
| `cd` | 切换目录 |
| `mkdir` | 创建目录 |
| `rmdir` | 删除空目录 |
| `rm` | 删除文件或目录 |
| `cp` | 复制文件或目录 |
| `mv` | 移动或重命名文件 |
| `touch` | 创建空文件或更新时间戳 |
| `cat` | 查看或拼接文件内容 |
| `less` | 分页查看文件 |
| `more` | 分页查看文件 |
| `head` | 查看文件开头 |
| `tail` | 查看文件末尾 |
| `file` | 识别文件类型 |
| `find` | 按条件查找文件 |
| `locate` | 通过索引查找文件 |
| `ln` | 创建硬链接或软链接 |
| `stat` | 查看文件详细信息 |
| `tree` | 树形展示目录结构 |

## 02 权限与用户管理

| 命令 | 中文作用 |
|---|---|
| `chmod` | 修改文件权限 |
| `chown` | 修改文件所有者及所属组 |
| `chgrp` | 修改文件所属组 |
| `umask` | 查看或设置默认权限掩码 |
| `sudo` | 以授权身份执行命令 |
| `su` | 切换用户 |
| `whoami` | 查看当前用户名 |
| `id` | 查看用户及用户组标识 |
| `who` | 查看已登录用户 |
| `groups` | 查看用户所属组 |
| `useradd` | 添加用户 |
| `userdel` | 删除用户 |
| `usermod` | 修改用户信息 |
| `passwd` | 修改用户密码 |
| `groupadd` | 添加用户组 |
| `groupdel` | 删除用户组 |

## 03 文本处理与日志查看

| 命令 | 中文作用 |
|---|---|
| `grep` | 搜索匹配文本 |
| `sed` | 按规则编辑文本 |
| `awk` | 按字段处理和统计文本 |
| `cut` | 提取文本指定字段 |
| `sort` | 对文本行排序 |
| `uniq` | 处理相邻重复行 |
| `wc` | 统计行数、单词数和字节数 |
| `diff` | 比较文件差异 |
| `tr` | 替换或删除字符 |
| `tee` | 同时输出到屏幕和文件 |
| `xargs` | 将输入转换为命令参数 |
| `journalctl` | 查看 systemd 日志 |
| `dmesg` | 查看内核消息 |

## 04 进程与任务管理

| 命令 | 中文作用 |
|---|---|
| `ps` | 查看进程信息 |
| `top` | 动态查看进程资源占用 |
| `htop` | 交互式查看进程 |
| `pgrep` | 按名称查找进程 |
| `kill` | 向进程发送信号 |
| `pkill` | 按名称向进程发送信号 |
| `jobs` | 查看当前 Shell 的任务 |
| `bg` | 将任务转入后台运行 |
| `fg` | 将任务转入前台运行 |
| `nohup` | 忽略终端挂断信号运行程序 |
| `nice` | 设置进程启动优先级 |
| `renice` | 调整运行中进程的优先级 |
| `crontab` | 管理定时任务 |

## 05 系统资源与磁盘管理

| 命令 | 中文作用 |
|---|---|
| `uname` | 查看系统与内核信息 |
| `hostname` | 查看或设置主机名 |
| `uptime` | 查看运行时间和系统负载 |
| `lscpu` | 查看 CPU 信息 |
| `nproc` | 查看可用处理单元数量 |
| `free` | 查看内存使用情况 |
| `df` | 查看文件系统磁盘空间 |
| `du` | 查看文件或目录占用空间 |
| `lsblk` | 查看块设备 |
| `mount` | 挂载文件系统 |
| `umount` | 卸载文件系统 |
| `vmstat` | 查看系统资源统计 |
| `iostat` | 查看磁盘 IO 统计 |
| `iotop` | 查看进程 IO 占用 |
| `lsof` | 查看进程打开的文件 |

## 06 网络与远程连接

| 命令 | 中文作用 |
|---|---|
| `ip` | 查看或配置网络地址和路由 |
| `ping` | 测试网络连通性 |
| `curl` | 发起网络请求 |
| `wget` | 下载网络文件 |
| `ss` | 查看网络连接与监听端口 |
| `netstat` | 查看网络连接与统计信息（旧工具） |
| `nc` | 测试网络端口与传输数据 |
| `dig` | 查询 DNS 信息 |
| `nslookup` | 查询域名解析 |
| `traceroute` | 追踪网络路径 |
| `ssh` | 远程登录服务器 |
| `ssh-keygen` | 生成或管理 SSH 密钥 |
| `ssh-copy-id` | 将 SSH 公钥安装到远程主机 |
| `scp` | 通过 SSH 复制文件 |
| `rsync` | 同步文件和目录 |

## 07 压缩与备份

| 命令 | 中文作用 |
|---|---|
| `tar` | 打包或解包文件 |
| `gzip` | 使用 gzip 压缩文件 |
| `gunzip` | 解压 gzip 文件 |
| `zip` | 创建 ZIP 压缩包 |
| `unzip` | 解压 ZIP 压缩包 |
| `bzip2` | 使用 bzip2 压缩文件 |
| `xz` | 使用 xz 压缩文件 |
| `sha256sum` | 计算 SHA-256 校验值 |

## 08 软件与服务管理

| 命令 | 中文作用 |
|---|---|
| `apt` | Debian/Ubuntu 软件包管理 |
| `dnf` | RHEL 系软件包管理 |
| `yum` | RHEL 系软件包管理（旧工具） |
| `dpkg` | 管理 Debian 软件包 |
| `rpm` | 管理 RPM 软件包 |
| `systemctl` | 管理 systemd 服务 |
| `service` | 管理系统服务（兼容接口） |
| `which` | 查找可执行命令路径 |
| `type` | 判断命令的类型和来源 |
| `man` | 查看命令手册 |
| `history` | 查看 Shell 历史命令 |

## 09 Shell 脚本与环境

| 命令 | 中文作用 |
|---|---|
| `echo` | 输出文本或变量值 |
| `printf` | 格式化输出文本 |
| `read` | 读取输入 |
| `export` | 导出环境变量 |
| `env` | 查看或设置命令运行环境 |
| `source` | 在当前 Shell 中执行脚本 |
| `alias` | 设置命令别名 |
| `unalias` | 取消命令别名 |
| `test` | 判断条件是否成立 |
| `sleep` | 暂停指定时间 |
| `date` | 查看或设置日期时间 |
| `bash` | 启动 Bash 或执行脚本 |

## 10 Git 版本管理

| 命令 | 中文作用 |
|---|---|
| `git clone` | 克隆远程仓库 |
| `git init` | 初始化仓库 |
| `git status` | 查看工作区状态 |
| `git add` | 暂存文件修改 |
| `git commit` | 提交本地修改 |
| `git log` | 查看提交历史 |
| `git diff` | 查看文件差异 |
| `git branch` | 管理分支 |
| `git switch` | 切换分支 |
| `git fetch` | 获取远程更新 |
| `git pull` | 拉取并整合远程更新 |
| `git push` | 推送本地提交 |
| `git merge` | 合并分支 |
| `git rebase` | 将提交重新应用到新基点 |
| `git stash` | 临时保存工作区修改 |
| `git revert` | 通过新提交撤销指定提交 |
| `git reset` | 重置提交指针或暂存状态 |

## 11 Hadoop / HDFS 管理

| 命令 | 中文作用 |
|---|---|
| `jps` | 查看可见的 Java 进程 |
| `start-dfs.sh` | 启动 HDFS 服务 |
| `stop-dfs.sh` | 停止 HDFS 服务 |
| `start-yarn.sh` | 启动 YARN 服务 |
| `stop-yarn.sh` | 停止 YARN 服务 |
| `hdfs dfs -ls` | 查看 HDFS 目录 |
| `hdfs dfs -mkdir` | 创建 HDFS 目录 |
| `hdfs dfs -put` | 上传本地文件到 HDFS |
| `hdfs dfs -get` | 下载 HDFS 文件到本地 |
| `hdfs dfs -cat` | 查看 HDFS 文件内容 |
| `hdfs dfs -rm` | 删除 HDFS 文件 |
| `hdfs dfs -du` | 查看 HDFS 文件空间占用 |
| `hdfs dfs -count` | 统计 HDFS 文件与目录数量 |
| `hdfs dfsadmin -report` | 查看 HDFS 集群状态报告 |
| `hdfs dfsadmin -safemode` | 查询或管理 HDFS 安全模式 |
| `hdfs fsck` | 检查 HDFS 文件与数据块健康状态 |

## 12 YARN / Spark / Hive

| 命令 | 中文作用 |
|---|---|
| `yarn application -list` | 查看 YARN 应用列表 |
| `yarn application -status` | 查看 YARN 应用状态 |
| `yarn application -kill` | 终止 YARN 应用 |
| `yarn logs` | 查看 YARN 应用日志 |
| `yarn node -list` | 查看 YARN 节点列表 |
| `spark-submit` | 提交 Spark 作业 |
| `spark-shell` | 启动 Spark Scala 交互环境 |
| `pyspark` | 启动 PySpark 交互环境 |
| `spark-sql` | 启动 Spark SQL 命令行 |
| `beeline` | 连接 HiveServer2 并执行 SQL |
| `hive` | 启动 Hive 命令行（旧版常见） |

---

> 注：部分命令需额外安装或具备相应权限；Hadoop、Spark、Hive 命令需在对应组件环境中使用。
