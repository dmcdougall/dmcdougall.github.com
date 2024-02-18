---
layout: post
title: Generic accumulator functions using numpy
date: 2014-02-10 20:33:03.000000000 -06:00
---
### 2024-02-17 update

A very astute observer stumbled across this post almost ten years after
I wrote it to kindly inform me that:

- The `dtype` keyword argument is no longer needed in numpy.ufunc.accumulate
  - But I've left it in the code in the [workaround](#workaround) for
    posterity's sake
- There is a related issue/feature request here:
  [https://github.com/numpy/numpy/issues/14020](https://github.com/numpy/numpy/issues/14020)

Now back to the original article...

So `numpy.cumsum` is pretty useful.  It returns an array of the running sum of elements from another array.

```
In [1]: a = np.array([1, 2, 3, 4])

In [2]: np.cumsum(a)
Out[2]: array([ 1,  3,  6, 10])
```

It's sometimes the case that I don't *quite* want to compute the cumulative sum, but instead some small variation.  Say I wanted to compute this instead: `b[i] = b[i-1] + c * a[i]` for each `i = 1, 2, 3, ..., n`.

Well now I'm stuffed.  I can't hack `cumsum` to give me the right thing.  Although, during my quest of trying, I discovered that `numpy.cumsum` is identical to `numpy.add.acumulate`.  Then I read [the documentation](http://docs.scipy.org/doc/numpy/reference/generated/numpy.ufunc.accumulate.html) for `accumulate` and understood that any binary `numpy.ufunc` will implement the `accumulate` method and 'do the right thing'.  The function `numpy.multiply` is one such example and gives rise to `numpy.cumprod`.

So, now I needed to write my own `ufunc`.  Turns out it's [kind of a disaster](http://docs.scipy.org/doc/numpy/user/c-info.ufunc-tutorial.html) when you just want something quick and dirty.

### To the rescue: `numpy.frompyfunc`

Well, it turns out I don't need to write any `c`.  I can define a normal python binary function:

```
In [3]: def f(x, y):
   ...:     return x + 2.0 * y
   ...:
```

And I can convert it to a `ufunc` like so:

```
In [4]: f_ufunc = np.frompyfunc(f, 2, 1)  # f takes 2 args and returns one
```

Blast!  Ye not work:

```
In [13]: a = np.array([1.0, 2.0, 3.0, 4.0])

In [14]: f_ufunc.accumulate(a)
---------------------------------------------------------------------------
ValueError                                Traceback (most recent call last)
<ipython-input-14-6afc67f05a6b> in <module>()
----> 1 f_ufunc.accumulate(a)

ValueError: could not find a matching type for f (vectorized).accumulate, requested type has type code 'd'
```

### The workaround {#workaround}

Turns out I didn't have to do any of the hard work.  There's an open (as of `numpy` version 1.8.0) [ticket on github](https://github.com/numpy/numpy/issues/4155) that gives the workaround:

```
In [15]: a = np.array([1.0, 2.0, 3.0, 4.0], dtype=object)

In [16]: f_ufunc.accumulate(a)
Out[16]: array([1.0, 5.0, 11.0, 19.0], dtype=object)
```

Victory.
