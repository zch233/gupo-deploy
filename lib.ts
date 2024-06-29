import inquirer from 'inquirer';
import {spawn} from 'child_process';

export const getRemoteTags = () => spawn('git', ['fetch', '--tags']);
export const getLatestTag = () => spawn('git', ['describe']);
export const getLatestTags = (currentTag: string) => spawn('git', ['tag', '-l', '--sort=-v:refname', `${currentTag}*`]);
export const addTag = (version: string) => spawn('git', ['tag', '-a', version, '-m', 'auto deploy version']);
export const pushTag = () => spawn('git', ['push', '--tags']);
export const pushCode = () => spawn('git', ['push']);

export const publish = async (latestTag: string, customer?: boolean, verboseMode?: boolean) => {
  let featureTag = ''
  const _latestTag = latestTag.split('\n')[0]
  if (verboseMode) {
    featureTag = await showVerbose(_latestTag)
  } else if (!customer) {
    console.log('当前最新值为:', latestTag.split('\n')[0]);
    featureTag = getFeatureVersion(_latestTag, 'patch')
  }
  console.log('即将发布为:', featureTag);
  addTag(featureTag).stdout.on('end', () => {
    console.log('新增成功~');
    pushTag().stdout.on('end', () => {
      console.log('发布成功~');
    });
    pushTag().on('error', (chunk) => {
      console.log('发布失败~');
      console.log('请手动运行 `git push --tags`');
      console.log('错误信息:', chunk.toString());
    });
  });
}

export const getFeatureVersion = (tag: string, mode: 'major' | 'minor' | 'patch') => {
  const array = tag.split('.');
  if (mode === 'patch' && array.length > 1) {
    array[array.length - 1] = (Number(array.slice(-1)) + 1).toString();
  } else if (mode === 'minor' && array.length === 3) {
    array[array.length - 2] = (Number(array.slice(-2, -1)) + 1).toString();
    array[array.length - 1] = '0'
  } else if (mode === 'major') {
    array[0] = array[0].slice(0, -1) + (Number(array[0].slice(array[0].lastIndexOf('v') + 1)) + 1).toString();
    array[array.length - 1] = '0'
    array[array.length - 2] = '0'
  }
  return array.join('.');
}

export const showVerbose = async (tag: string) => {
  const oldVersion = tag;
  const next = {
    major: getFeatureVersion(tag, 'major'),
    minor: getFeatureVersion(tag, 'minor'),
    patch: getFeatureVersion(tag, 'patch'),
  };
  let prompts = inquirer.createPromptModule();
  const res = await inquirer.prompt([
    {
      type: 'list',
      name: 'release',
      message: `\n当前获取到的最新版是 ${ oldVersion }\n你想发布哪个版本?`,
      default: 'patch',
      pageSize: 10,
      choices: [
        { value: 'major', name: `major (${ next.major })` },
        { value: 'minor', name: `minor (${ next.minor })` },
        { value: 'patch', name: `patch (${ next.patch })` },
        new inquirer.Separator(),
        { value: 'custom', name: 'custom...' },
      ],
    },
    {
      type: 'input',
      name: 'newVersion',
      message: '请输入你的版本号（例如2.3.3）:',
      default: oldVersion.slice(oldVersion.lastIndexOf('v') + 1),
      when: (previousAnswer_1) => previousAnswer_1.release === 'custom',
      filter: version_1 => version_1.trim().replace(/^[=v]+/, ''),
      validate: (newVersion_1: string) => {
        return /^\d+$/.test(newVersion_1.split('.').join('')) ? true : '请输入正确的版本号（例如2.3.3 或 v2.3.3）';
      },
    },
  ]);
  return res.release === 'custom' ? `${getPureTag(tag)}${res.newVersion}` : next[res.release as keyof typeof next];
}

export const getPureTag = (tag: string) => tag.slice(0, tag.lastIndexOf('v') + 1)

