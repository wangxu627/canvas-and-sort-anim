var path = require('path')

module.exports = {
    entry: './js/app.js', //入口文件
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: 'bundle.js' //打包好的文件名
    },
    module: {
        rules : [{
            test: path.join(__dirname, 'js'),
            loader: 'babel-loader'
        }]
    }
};