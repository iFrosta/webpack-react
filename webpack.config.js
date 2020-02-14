const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const CopyPlugin = require('copy-webpack-plugin')

const autoprefixer = require('autoprefixer')

const isDev = process.env.NODE_ENV === 'development'
const isProd = !isDev

const optimization = () => {
  const config = {
    splitChunks: {
      chunks: "all"
    }
  }

  if (isProd) {
    config.minimizer = [
      new OptimizeCssAssetsPlugin(),
      new TerserWebpackPlugin()
    ]
  }
  return config;
};

const filename = ext => isDev ? `[name].${ext}` : `[name].[hash].${ext}`;

const cssLoaders = extra => {
  const loaders = [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        hmr: isDev,
        reloadAll: true
      },
    },
    'css-loader',
  ]

  if (isProd) {
    loaders.push(
      {
        loader: 'postcss-loader',
        options: {
          plugins: [
            autoprefixer()
          ],
          sourceMap: true
        }
      },
    )
  }

  if (extra) {
    loaders.push(extra);
  }

  return loaders
};

const babelOptions = preset => {
  const options = {
    presets: [
      '@babel/preset-env',
    ],
    plugins: [
      '@babel/plugin-proposal-class-properties'
    ]
  }

  if (preset) {
    options.presets.push(preset);
  }

  return options;
}

const plugins = () => {
  const base = [
    new HTMLWebpackPlugin({
      template: "./index.html",
      minify: {
        collapseWhitespace: isProd,
        removeComments: isProd,
      }
    }),
    new CleanWebpackPlugin(),
    // new CopyPlugin([]),
    new MiniCssExtractPlugin({
      filename: filename('css'),
    })
  ]

  if (isDev) base.push(new BundleAnalyzerPlugin())

  return base
}

const jsLoaders = () => {
  const loaders = [{
    loader: 'babel-loader',
    options: babelOptions()
  }]

  if (isDev) loaders.push('eslint-loader')

  return loaders
}

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: {
    main: ['@babel/polyfill', './index.jsx'],
  },
  output: {
    filename: filename('js'),
    path: path.resolve(__dirname, 'dist')
  },
  resolve: {
    extensions: ['.js', '.json', '.png'],
    alias: {
      '@models': path.resolve(__dirname, 'src/models'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@': path.resolve(__dirname, 'src'),
    }
  },
  optimization: optimization(),
  devServer: {
    port: 4200,
    open: isDev,
    hot: isDev
  },
  devtool: isDev ? 'source-map' : '',
  plugins: plugins(),
  module: {
    rules: [
      {
        test: /\.css$/,
        use: cssLoaders()
      },
      {
        test: /\.s[ac]ss$/i,
        use: cssLoaders({
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sassOptions: {
                fiber: false,
              },
            },
          },
        )
      },
      {
        test: /\.(png|jpg|svg|gif)$/,
        use: ['file-loader']
      },
      {
        test: /\.(ttf|woff|woff2|eot)$/,
        use: ['file-loader']
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: jsLoaders()
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-typescript')
        }
      },
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: {
          loader: 'babel-loader',
          options: babelOptions('@babel/preset-react')
        }
      }
    ]
  }
};

