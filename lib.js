"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publish = exports.pushCode = exports.pushTag = exports.addTag = exports.getLatestTags = exports.getLatestTag = exports.getRemoteTags = void 0;
var child_process = require('child_process');
var spawn = child_process.spawn;
var getRemoteTags = function () { return spawn('git', ['fetch', '--tags']); };
exports.getRemoteTags = getRemoteTags;
var getLatestTag = function () { return spawn('git', ['describe']); };
exports.getLatestTag = getLatestTag;
var getLatestTags = function (currentTag) { return spawn('git', ['tag', '-l', '--sort=-v:refname', "".concat(currentTag, "*")]); };
exports.getLatestTags = getLatestTags;
var addTag = function (version) { return spawn('git', ['tag', '-a', version, '-m', 'auto deploy version']); };
exports.addTag = addTag;
var pushTag = function () { return spawn('git', ['push', '--tags']); };
exports.pushTag = pushTag;
var pushCode = function () { return spawn('git', ['push']); };
exports.pushCode = pushCode;
var publish = function (latestTag, customer) {
    !customer && console.log('当前最新值为:', latestTag.split('\n')[0]);
    var array = latestTag.split('\n')[0].split('.');
    !customer && array.splice(-1, 1, (Number(array.slice(-1)) + 1).toString());
    console.log('即将发布为:', array.join('.'));
    (0, exports.addTag)(array.join('.')).stdout.on('end', function () {
        console.log('新增成功~');
        (0, exports.pushTag)().stdout.on('end', function () {
            console.log('发布成功~');
        });
        (0, exports.pushCode)().on('error', function (chunk) {
            console.log('发布失败~');
            console.log('请手动运行 `git push --tags`');
            console.log('错误信息:', chunk.toString());
        });
    });
};
exports.publish = publish;
