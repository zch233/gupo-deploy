"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showVerbose = exports.getFeatureVersion = exports.publish = exports.pushCode = exports.pushTag = exports.addTag = exports.getLatestTags = exports.getLatestTag = exports.getRemoteTags = void 0;
var inquirer_1 = require("inquirer");
var child_process_1 = require("child_process");
var getRemoteTags = function () { return (0, child_process_1.spawn)('git', ['fetch', '--tags']); };
exports.getRemoteTags = getRemoteTags;
var getLatestTag = function () { return (0, child_process_1.spawn)('git', ['describe']); };
exports.getLatestTag = getLatestTag;
var getLatestTags = function (currentTag) { return (0, child_process_1.spawn)('git', ['tag', '-l', '--sort=-v:refname', "".concat(currentTag, "*")]); };
exports.getLatestTags = getLatestTags;
var addTag = function (version) { return (0, child_process_1.spawn)('git', ['tag', '-a', version, '-m', 'auto deploy version']); };
exports.addTag = addTag;
var pushTag = function () { return (0, child_process_1.spawn)('git', ['push', '--tags']); };
exports.pushTag = pushTag;
var pushCode = function () { return (0, child_process_1.spawn)('git', ['push']); };
exports.pushCode = pushCode;
var publish = function (latestTag, customer, verboseMode) { return __awaiter(void 0, void 0, void 0, function () {
    var featureTag, _latestTag;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                featureTag = '';
                _latestTag = latestTag.split('\n')[0];
                if (!verboseMode) return [3 /*break*/, 2];
                return [4 /*yield*/, (0, exports.showVerbose)(_latestTag)];
            case 1:
                featureTag = _a.sent();
                return [3 /*break*/, 3];
            case 2:
                if (!customer) {
                    console.log('当前最新值为:', latestTag.split('\n')[0]);
                    featureTag = (0, exports.getFeatureVersion)(_latestTag, 'patch');
                }
                _a.label = 3;
            case 3:
                console.log('即将发布为:', featureTag);
                (0, exports.addTag)(featureTag).stdout.on('end', function () {
                    console.log('新增成功~');
                    (0, exports.pushTag)().stdout.on('end', function () {
                        console.log('发布成功~');
                    });
                    (0, exports.pushTag)().on('error', function (chunk) {
                        console.log('发布失败~');
                        console.log('请手动运行 `git push --tags`');
                        console.log('错误信息:', chunk.toString());
                    });
                });
                return [2 /*return*/];
        }
    });
}); };
exports.publish = publish;
var getFeatureVersion = function (tag, mode) {
    var array = tag.split('.');
    if (mode === 'patch' && array.length > 1) {
        array[array.length - 1] = (Number(array.slice(-1)) + 1).toString();
    }
    else if (mode === 'minor' && array.length === 3) {
        array[array.length - 2] = (Number(array.slice(-1)) + 1).toString();
    }
    else if (mode === 'major') {
        array[0] = array[0].slice(0, -1) + (Number(array[0].split('').slice(-1)) + 1).toString();
    }
    return array.join('.');
};
exports.getFeatureVersion = getFeatureVersion;
var showVerbose = function (tag) {
    var oldVersion = tag;
    var next = {
        major: (0, exports.getFeatureVersion)(tag, 'major'),
        minor: (0, exports.getFeatureVersion)(tag, 'minor'),
        patch: (0, exports.getFeatureVersion)(tag, 'patch'),
    };
    var prompts = inquirer_1.default.createPromptModule();
    return prompts([
        {
            type: "list",
            name: "release",
            message: "\nThe current version in codeup is ".concat(oldVersion, "\nHow would you like to bump it?"),
            default: "patch",
            pageSize: 10,
            choices: [
                { value: "major", name: "major (".concat(next.major, ")") },
                { value: "minor", name: "minor (".concat(next.minor, ")") },
                { value: "patch", name: "patch (".concat(next.patch, ")") },
                new inquirer_1.default.Separator(),
                { value: "custom", name: "custom..." },
            ]
        },
        {
            type: "input",
            name: "newVersion",
            message: "Enter the new version number:",
            default: oldVersion,
            when: function (previousAnswer) { return previousAnswer.release === "custom"; },
            filter: function (version) { return version.trim().replace(/^[=v]+/, ''); },
            validate: function (newVersion) {
                return /^\d+$/.test(newVersion.split('.').join('')) ? true : "That's not a valid version number";
            },
        }
    ]).then(function (res) {
        return res.release === 'custom' ? res.newVersion : next[res.release];
    });
};
exports.showVerbose = showVerbose;
