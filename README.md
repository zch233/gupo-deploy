# gupo-deploy

## 食用方法
```
默认读取环境变量(.env)中的 `OSS_TAG` 作为标签，
例如 OSS_TAG=oss-test-v // OSS_TAG=oss-test-v
自动打下的标签则为 `oss-test-v1.0.1`
每次将在末位版本号 `+1`
```

或
```
gupo-deploy --oss_tag=oss-test-v
强行指定将要打下的标签名称（这里的优先级比文件中的变量高）
```

## 环境变量

```
你也可以指定当前环境
gupo-deploy --mode xxx
执行上述命令会去寻找并读取当前目录下的 `.env.xxx` 下的 `OSS_TAG`
```

