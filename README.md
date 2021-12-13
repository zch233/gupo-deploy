# gupo-deploy

## 食用方法

### 快速体验

##### 安装

```
npm install gupo-deploy -g

// or

yarn global add gupo-deploy
```
##### 使用

```
gupo-deploy -ss
```

### 标准用法，根据标签名称发布

```
gupo-deploy --oss_tag [name*]

例如：

gupo-deploy --oss_tag oss-test-v
```

### 环境变量

> 默认读取环境变量(.env)中的 `OSS_TAG` 作为标签，
> 例如：OSS_TAG=oss-test-v
> 自动打下的标签则为 `oss-test-v1.0.1` // 若上一次的为 oss-test-v1.0.0
> 每次将在末位版本号 `+1`

##### 使用
```
// .env 或者 .env.xxx
OSS_TAG=oss-test-v
```
```
// package.json
{
  ...
  "scripts": {
    ...
    "deploy": "gupo-deploy" // or "gupo-deploy --mode .env.xxx"
  }
}
```
```
// 以后只要运行下面这行命令即可
yarn deploy

// or

npm run deploy
```


*大版本更新请手动发布*