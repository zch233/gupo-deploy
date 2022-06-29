const child_process = require('child_process');
const {spawn} = child_process;

export const getRemoteTags = () => spawn('git', ['fetch', '--tags']);
export const getLatestTag = () => spawn('git', ['describe']);
export const getLatestTags = (currentTag) => spawn('git', ['tag', '-l', '--sort=-v:refname', `${currentTag}*`]);
export const addTag = (version) => spawn('git', ['tag', '-a', version, '-m', 'auto deploy version']);
export const pushTag = () => spawn('git', ['push', '--tags']);
export const pushCode = () => spawn('git', ['push']);

export const publish = (latestTag: string, customer?: boolean) => {
  console.log('当前最新值为:', latestTag.split('\n')[0]);
  const array = latestTag.split('\n')[0].split('.')
  !customer && array.splice(-1, 1, (Number(array.slice(-1)) + 1).toString())
  console.log('即将发布为:', array.join('.'));
  addTag(array.join('.')).stdout.on('end', () => {
    console.log('新增成功~');
    pushTag().stdout.on('end', () => {
      console.log('发布成功~');
    });
    pushCode().on('error', (chunk) => {
      console.log('发布失败~');
      console.log('请手动运行 `git push --tags`');
      console.log('错误信息:', chunk.toString());
    });
  });
}