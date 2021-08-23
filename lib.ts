const child_process = require('child_process');
const {spawn} = child_process;

export const getRemoteTags = () => spawn('git', ['fetch', '--tags']);
export const getLatestTag = () => spawn('git', ['describe']);
export const getLatestTags = (currentTag) => spawn('git', ['tag', '-l', '--sort=-v:refname', `${currentTag}*`]);
export const getAddTag = (version) => spawn('git', ['tag', '-a', version, '-m', 'auto deploy version']);
export const getPushTag = () => spawn('git', ['push', '--tags']);

export const publish = (latestTag: string) => {
  console.log('当前最新值为:', latestTag.split('\n')[0]);
  const array = latestTag.split('\n')[0].split('.')
  array.splice(-1, 1, (Number(array.slice(-1)) + 1).toString())
  console.log('即将发布为:', array.join('.'));
  getAddTag(array.join('.')).stdout.on('end', () => {
    console.log('新增成功~');
    getPushTag().stdout.on('end', () => {
      console.log('发布成功~');
    });
    getPushTag().on('error', (chunk) => {
      console.log('发布失败~');
      console.log('请手动运行 `git push --tags`');
      console.log('错误信息:', chunk.toString());
    });
  });
}