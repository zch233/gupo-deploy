#!/usr/bin/env node
var argModeIndex = process.argv.findIndex(function (v) { return v === '--mode'; });
var argTagIndex = process.argv.findIndex(function (v) { return v === '--oss_tag'; });
var argMode = argModeIndex >= 0 ? process.argv[argModeIndex + 1] : undefined;
var argTag = argTagIndex >= 0 ? process.argv[argTagIndex + 1] : undefined;
require("dotenv").config({ path: require('path').resolve(process.cwd(), ".env" + (argMode ? "." + argMode : '')) });
console.log('当前环境为:', argMode || '默认（.env）');
var currentTag = argTag || process.env.OSS_TAG;
if (!currentTag) {
    console.log('未设置 OSS_TAG 环境变量');
    process.exit(0);
}
var child_process = require('child_process');
var spawn = child_process.spawn;
var getRemoteTags = function () { return spawn('git', ['fetch', '--tags']); };
var getLatestTags = function () { return spawn('git', ['tag', '-l', '--sort=-v:refname', currentTag + "*"]); };
var getAddTag = function (version) { return spawn('git', ['tag', '-a', version, '-m', 'deploy test version']); };
var getPushTag = function () { return spawn('git', ['push', '--tags']); };
getRemoteTags().stdout.on('end', function () {
    console.log('拉取成功~');
    var gitTagData = '';
    getLatestTags().stdout.on('data', function (chunk) { return gitTagData += chunk.toString(); });
    getLatestTags().stdout.on('end', function () {
        console.log('读取成功~');
        var latestTag = gitTagData.split('\n')[0] || currentTag + "0.0.0";
        console.log('当前最新值为:', latestTag);
        var array = latestTag.split('.');
        array.splice(-1, 1, (Number(array.slice(-1)) + 1).toString());
        console.log('即将发布为:', array.join('.'));
        getAddTag(array.join('.')).stdout.on('end', function () {
            console.log('新增成功~');
            getPushTag().stdout.on('end', function () {
                console.log('发布成功~');
            });
            getPushTag().on('error', function (chunk) {
                console.log('发布失败~');
                console.log('请手动运行 `git push --tags`');
                console.log('错误信息:', chunk.toString());
            });
        });
    });
});
