# test-coverage-cli
### 1.为了达到多种项目平台可用，以及对原项目的代码侵入性最低和功能的易扩展性考虑等，综上我们将此插桩工具设计为脚手架（Cli)。该脚手架提供以下几种命令。 
  * `instrument` 
  * `merge`
  * `reporter`
  * `uploader`

``` bash 
# instrument 通过instrument命令可以对需要实现代码测试覆盖率的项目进行代码插桩。
cli-test instrument <input-directory> [output-directory] 

# merge 通过merge命令可以对上报的一份货多份测试代码覆盖率数据进行合并、生成一份新的测试代码覆盖率数据。
cli-test merge <input-directory> [output-file]

# report 通过reporter命令可以对上述测试代码覆盖率数据导出成一份可视化的网页进行更加直观的预览
cli-test report <input-directory> [output-directory]
```



## 设计思路
在代码进行构建发布构建前，采用`instrument`命令对项目进行插桩后再进行构建发布，对开发人员来说是无感插入的。也不会影响原项目代码。项目接入成本低.

通过提供开始收集和结束收集两种接口，可以实现按需收集，在测试人员需要进行测试代码覆盖率时在进行收集。以及测试完成后结束收集进行数据的上报。避免在其它情况下收集到多份无用的测试代码覆盖率数据。造成磁盘空间以及网络带宽的浪费

## Config
``` json
# test-coverage.config.js
{
  extension: ['.js', '.ts', '.vue'],
  all: true,
  exclude: ['**/*.d.ts', '**/*.css', '*.scss'],
  reporter: ['html-spa', 'lcov', 'html'],
  reportDir: './report',
}
```

## TODO:
 [ ] uploader: 通过uploader命令可以对上述测试代码覆盖率数据导出成一份可视化的网页进行预览