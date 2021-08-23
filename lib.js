"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publish = exports.getPushTag = exports.getAddTag = exports.getLatestTags = exports.getLatestTag = exports.getRemoteTags = void 0;
var child_process = require('child_process');
var spawn = child_process.spawn;
var getRemoteTags = function () { return spawn('git', ['fetch', '--tags']); };
exports.getRemoteTags = getRemoteTags;
var getLatestTag = function () { return spawn('git', ['describe']); };
exports.getLatestTag = getLatestTag;
var getLatestTags = function (currentTag) { return spawn('git', ['tag', '-l', '--sort=-v:refname', currentTag + "*"]); };
exports.getLatestTags = getLatestTags;
var getAddTag = function (version) { return spawn('git', ['tag', '-a', version, '-m', 'auto deploy version']); };
exports.getAddTag = getAddTag;
var getPushTag = function () { return spawn('git', ['push', '--tags']); };
exports.getPushTag = getPushTag;
var publish = function (latestTag) {
    console.log('当前最新值为:', latestTag.split('\n')[0]);
    var array = latestTag.split('\n')[0].split('.');
    array.splice(-1, 1, (Number(array.slice(-1)) + 1).toString());
    console.log('即将发布为:', array.join('.'));
    exports.getAddTag(array.join('.')).stdout.on('end', function () {
        console.log('新增成功~');
        exports.getPushTag().stdout.on('end', function () {
            console.log('发布成功~');
        });
        exports.getPushTag().on('error', function (chunk) {
            console.log('发布失败~');
            console.log('请手动运行 `git push --tags`');
            console.log('错误信息:', chunk.toString());
        });
    });
};
exports.publish = publish;
