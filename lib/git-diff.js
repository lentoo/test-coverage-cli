const { get } = require('./gitlab-api');
const gitDiffParser = require('gitdiff-parser');

const getBranchSHA1 = async (branchName) => {
  const result = await get('/repository/branches/' + branchName);
  return result.data.commit.id;
};

const compare = async (baseBranch, headBranch) => {
  const result = await get('/repository/compare', {
    from: baseBranch,
    to: headBranch,
  });
  return result.data;
};

function format(diff) {
  const s = `diff --git a/${diff.old_path} b/${diff.new_path}
index 1..1 ${diff.a_mode}
--- a/${diff.old_path}
+++ b/${diff.new_path}
${diff.diff}
`;
  // console.log(s);
  // return gitDiffParser(s);
  return s;
}

const parser = (diff) => {
  const diffs = diff.diffs;
  let str = '';
  diffs.forEach((diff) => {
    const obj = format(diff);
    str += obj;
  });
  const gitDiff = gitDiffParser.parse(str);
  return gitDiff;

  // const changeFiles = gitDiff.map((d) => {
  //   return {
  //     oldPath: d.oldPath,
  //     newPath: d.newPath,
  //   };
  // });
};

const covertLines = (diffParser) => {
  const linesMap = {};
  diffParser.forEach((d) => {
    linesMap[d.newPath] = [];
    d.hunks.forEach((h) => {
      h.changes.forEach((c) => {
        if (c.isNormal) {
          linesMap[d.newPath].push(c.newLineNumber);
        } else {
          linesMap[d.newPath].push(c.lineNumber);
        }
      });
    });
  });
  return linesMap;
};
module.exports = {
  getBranchSHA1,
  compare,
  parser,
  covertLines,
};
