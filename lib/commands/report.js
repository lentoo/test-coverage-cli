const { exportToFile } = require('../reporter')

exports.command = 'report <input-directory> [output-directory]'

exports.describe = 'run coverage report'


exports.builder = function (yargs) {
  yargs
    .demandCommand(0, 0)
    .example('$0 report --reporter=lcov', 'output an HTML lcov report to ./coverage')
}

exports.handler = async argv => {
  process.env.CWD = process.cwd()
  
  
  exportToFile(argv)

}
