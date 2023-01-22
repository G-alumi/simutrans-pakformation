# simutrans-pakformation
https://g-alumi.github.io/simutrans-pakformation/

つくったひと → https://twitter.com/G_alumi

ブラウザでSimutransのアドオンライブラリの編集ができる。

すべてJavascriptで、クライアント側の処理で動いてるため、処理速度はお使いのマシンに左右されます。 
あまりにも大きすぎるファイルだとブラウザ側でストップしたりするかもです。  
一応1GB超え、3万アドオン超えのライブラリを読み込み、書き出しはできました。3万アドオンを個別出力は試していないです。
## 使い方
### ファイルを追加
アドオンファイルを追加し、中身のアドオンを表示します。隣のプルダウンメニューでアドオンファイルごとにフィルタリングできます。  
同じファイル名+同じ更新日時のファイルでなければ追加できます。(同じ更新日時でなければ同じファイル名で違うバージョンのアドオンライブラリの管理等もできると思います。)
### 個別Pak出力
読み込んだアドオンのうちチェックの入ったアドオンを個別でアドオンファイルにしてzipにまとめて出力します。  
前述のとおりクライアント側での処理のため、またブラウザのメモリ限度等の制限のため出力できない場合もあります。その場合は小分けにて出力するなどしてください。
### アドオン追加・削除
チェックの入ったアドオンを出力リストに追加したり削除したりできます。実はShiftキーで範囲選択っぽいこともできるようにしてあります。
### アドオン出力
リストのアドオンをまとめたアドオンライブラリを出力します。
