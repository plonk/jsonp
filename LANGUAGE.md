# 言語の現状メモ

Scheme風Lisp。JS substrate

# シンボル

R6RSと同じで大文字正規化はなし。Symbol クラスのオブジェクト。Flyweight
なのでオブジェクト同一性で等価性が判断できる。

intern 関数で得る。intern("+") → +

# 定数

```
#<undef> undefined
#t true
#f false
() null
```

# リスト

null あるいは Pair クラスのオブジェクト。

# 文字列

JS の文字列と一緒。immutable。リテラルでは JS のバックスラッシュエスケー
プが使える。
