// 读取当前环境
var modeIndex = process.argv.findIndex(function (v) { return v === '--mode'; });
var currentMode = modeIndex >= 0 ? process.argv[process.argv.findIndex(function (v) { return v === '--mode'; }) + 1] : 'stage';
require("dotenv").config({ path: require('path').resolve(__dirname, ".env." + currentMode) });
console.log('当前环境为:', currentMode);
if (!process.env.OSS_TAG) {
    console.log('未设置 OSS_TAG 环境变量');
    process.exit(0);
}
var child_process = require('child_process');
var spawn = child_process.spawn;
var getRemoteTags = function () { return spawn('git', ['fetch', '--tags']); };
var getLatestTags = function () { return spawn('git', ['tag', '-l', '--sort=-v:refname', process.env.OSS_TAG + "*"]); };
var getAddTag = function (version) { return spawn('git', ['tag', '-a', version, '-m', 'deploy test version']); };
var getPushTag = function () { return spawn('git', ['push', '--tags']); };
getRemoteTags().stdout.on('end', function () {
    console.log('拉取成功~');
    getLatestTags().stdout.on('data', function (chunk) {
        console.log('读取成功~');
        var latestTag = chunk.toString().split('\n')[0] || process.env.OSS_TAG + "-v0.0.0";
        console.log('当前最新值为:', latestTag);
        var array = latestTag.split('.');
        array.splice(-1, 1, (Number(array.slice(-1)) + 1).toString());
        getAddTag(array.join('.')).stdout.on('end', function () {
            console.log('新增成功~');
            getPushTag().stdout.on('end', function () {
                console.log('发布成功~');
            });
        });
    });
});
