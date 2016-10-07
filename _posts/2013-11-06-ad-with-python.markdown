---
layout: post
title: 'Automatic differentiation:  What is it and why should I care?'
date: 2013-11-06 11:27:57.000000000 -06:00
---
Given a function \\( f \\), it is often useful to have an understanding of the derivative \\( f' \\).  Derivatives are useful in all fields of science, but they are not necessarily easy to calculate.  The most naive algorithm one can implement to differentiate `f` with respect to `x` is as follows:

    def derivative(f, x, h=1e-8):
        return (f(x) - f(x + h)) / h

From the definition of the derivative,

\\[f'(x) = \text{lim}_{h \to 0} \frac{f(x+h) - f(x)}{h},\\]

the smaller you make `h`, the more accurate your computed derivative gets.  The numerical analysts reading this are probably already cringing; don't worry.  For those that are not numerical analysts, it turns out that computing derivatives this way on a computer is not a good idea.  Not only is this calculation merely an approximation to the derivative, roundoff error makes the computation incorrect when `h` gets too small.  Instead, we're going to take a different route, a route that can produce exact derivatives for certain classes of functions.

## Dual numbers

First we need a few mathematical definitions of some objects that I will be using.  These aren't too complicated.

We define the set of dual numbers
$$\mathbb{D} := \lbrace a + b \varepsilon \, | \, a, b \in \mathbb{R} \rbrace$$,
with the added property that \\( \varepsilon^2 = 0 \\).  These look a bit like complex numbers but with an \\( \varepsilon \\) instead of an \\( i \\).  In fact, if, instead of \\( \varepsilon^2 = 0 \\), we had that \\( \varepsilon^2 = -1 \\) then \\( \mathbb{D} \\) would indeed be the set of complex numbers, \\( \mathbb{C} \\).

We now need to define what it means to add and multiply two dual numbers together.  One could write down many definitions of what it means to add two dual numbers, but we'll take the 'obvious' one:

\\[(a + b \varepsilon) + (c + d \varepsilon) = (a + c) + (b + d) \varepsilon.\\]

That is, we just add the like-terms of each dual number.

Note that \\( \varepsilon \\) is *not* a real number.  We make no attempt at understanding what numbers like \\( 1 + 3 \varepsilon \\) actually mean.  The symbol \\( \varepsilon \\) is just that, a symbol.  It is a symbol that follows the rule that when you multiply it by itself, you get zero.  With that in mind, we define what it means to multiply two dual numbers together like so,

\\[
\begin{aligned}
(a + b \varepsilon)(c + d \varepsilon) &= ac + ad \varepsilon + bc \varepsilon + bd \varepsilon^2 \\\
&= ac + (ad + bc) \varepsilon,
\end{aligned}
\\]

since \\( \varepsilon^2 = 0 \\).

You can also divide dual numbers.  I won't go through it, but it's a good exercise.  Given two dual numbers, \\( a + b \varepsilon \\) and \\( c + d \varepsilon \\), work out an expression for \\( \frac{a + b \varepsilon}{c + d \varepsilon} \\).  Furthermore, can you find any conditions on \\( a, b, c, d \\) such that the division doesn't work?  An obvious one is when \\( c = d = 0 \\), but can you find others?

So we have written down what it means to add or multiply two dual numbers together.  Using this, we can implement a dual number class in python relatively easily:

```
class DualNumber(object):
    """
    Dual numbers have the form z = a + be
    """
    def __init__(self, a, b):
        self.a = a
        self.b = b

    def __repr__(self):
        return str(self.a) + " + " + str(self.b) + " * e"

    def __add__(self, other):
        return DualNumber(self.a + other.a, self.b + other.b)
```

The `__add__` method is a python magic method that allows us to implement the `+` operation between two objects of type `DualNumber`:

```
In [1]: d1 = DualNumber(1, 2)

In [2]: print d1
1 + 2 * e

In [3]: d2 = DualNumber(3, 4)

In [4]: print d2
3 + 4 * e

In [5]: d1 + d2
Out[5]: 4 + 6 * e
```

Notice we can't add a `DualNumber` to an `int` yet:

```
In [6]: d1 + 4
---------------------------------------------------------------------------
AttributeError                            Traceback (most recent call last)
<ipython-input-3-2f7f1012ae70> in <module>()
----> 1 d1 + 4

/Users/damon/ad.py in __add__(self, other)
     11
     12     def __add__(self, other):
---> 13         return DualNumber(self.a + other.a, self.b + other.b)
     14
     15     def __sub__(self, other):

AttributeError: 'int' object has no attribute 'a'
```

Inside `__add__`, the variable `other` is of type `int`, which does not have a member variable called `a`.  To fix this, we can add some logic:

```
def __add__(self, other):
    if not isinstance(other, DualNumber):
        new_other = DualNumber(other, 0)
    else:
        new_other = other
    return DualNumber(self.a + new_other.a, self.b + new_other.b)
```

All I'm doing here is making sure that the thing on the right-hand side of the `+` operation is an object of type `DualNumber` and, if not, create one.  Numbers like `int`s and `float`s can trivially by converted to objects of type `DualNumber`, you just set the coefficient of \\( \epsilon \\) to zero.

```
In [7]: d1 + 4
Out[7]: 5 + 2 * e
```

The `__mul__` method works similarly:

```
def __mul__(self, other):
    """
    Multiplies two dual numbers together
    """
    if not isinstance(other, DualNumber):
        new_other = DualNumber(other, 0)
    else:
        new_other = other

    new_a = self.a * new_other.a
    new_b = self.a * new_other.b + self.b * new_other.a

    return DualNumber(new_a, new_b)
```

Now we can multiply two objects of type `DualNumber`:

```
In [8]: d1 * d2
Out[8]: 3 + 10 * e
```

## Functions of dual numbers

Most functions we want to differentiate aren't defined on the space of dual numbers.  Mostly we see functions that take a real number as input and give another real number back, \\( f : \mathbb{R} \to \mathbb{R} \\).  However, we know how to add, multiply, and divide dual numbers together, so for functions that only involve multiplication, addition, and division, we can actually apply them to dual numbers fairly easily.

For example, take the polynomial \\( p(x) = 3x^2 + 2x + 1 \\).  In python this looks like:

```
def p(x):
    return 3 * x * x + 2 * x + 1
```

Since we know how to multiply and add dual numbers, we can plug in an object of type `DualNumber` here and everything works as expected:

```
In [9]: p(d1)
Out[9]: 6 + 16 * e
```

So, if \\( f : \mathbb{R} \to \mathbb{R} \\) only involves multiplication, addition, or division, then we can extend the function to the duals, \\( \hat{f} : \mathbb{D} \to \mathbb{D} \\).

### Differentiating functions using the duals

You might be getting bored by now, and I don't blame you.  We haven't exactly done anything Earth-shattering here.  How do we use the dual numbers to get derivatives?  Well, what happens if we plug in a general dual number and compute the result by hand?  Using the polynomial \\( p \\) we defined above,

\\[
\begin{aligned}
p(a + b \epsilon) &= 3(a + b \epsilon)(a + b \epsilon) + 2(a + b \epsilon) + 1 \\\
&= 3a^2 + 6ab \epsilon + 3b^2 \epsilon^2 + 2a + 2b \epsilon + 1 \\\
&= 3a^2 + 6ab \epsilon + 2a + 2b \epsilon + 1 \\\
&= (3a^2 + 2a + 1) + (6ab + 2b) \epsilon \\\
&= (3a^2 + 2a + 1) + b(6a + 2) \epsilon
\end{aligned}
\\]

Let \\( b = 1 \\) and let \\( a = x \\):

\\[
\begin{aligned}
p(x + \epsilon) &= (3x^2 + 2x + 1) + (6x + 2) \epsilon \\\
&= p(x) + p'(x) \epsilon
\end{aligned}
\\]

The first term is just \\( p(x) \\), but the second term is \\( p'(x) \epsilon \\).  So if we plug in \\( x + \epsilon \\) to any given function \\( f \\), and just look at the coefficient of \\( \epsilon \\), we get the derivative:

```
def derivative(f):
    def f_prime(x):
        # Evaluate at x + e
        f_x_plus_epsilon = f(DualNumber(x, 1))

        # Get the coefficient of e
        deriv = f_x_plus_epsilon.b

        return deriv
    return f_prime
```

Returning the derivative like this means we can keep a hold of the callable:

```
In [10]: p_prime = derivative(p)

In [11]: p(3)  # Should print 3 * 3 * 3 + 2 * 3 + 1 = 34
Out[11]: 34

In [12]: p_prime(3)  # Should print 6 * 3 + 2 = 20
Out[12]: 20
```

### I want more derivatives

It's not unusual to ask for the second, third, or even higher derivatives.  The method outlined above can be easily extended to suit these needs.

For example, if you want second derivatives you need a new set of numbers of the form \\( a + b \epsilon + c \epsilon^2 \\), but with a different condition: \\( \epsilon^3 = 0 \\).

Can you implement a class in python to compute second derivatives?

### Differentiating more general functions

Automatic differentiation can only be used if the functions you are trying to differentiate only involve operations defined on the dual numbers.  In our case, those operations are addition, multiplication and division, so polynomials (or quotients thereof) are a good fit here.  Functions like \\( f(x) = \sin (x) \\) cannot be differentiated in this way, since one needs to make sense of \\( \sin (x + \epsilon) \\).

To differentiate more general functions than polynomials, one needs to have access to the Taylor series of that function.  Functions that are \\( k \\) times continuously differentiable can be approximated by a polynomial of degree \\( k \\).  Now we have a polynomial again and can use automatic differentiation.

## The code

Here's some complete code for you to throw rocks at:

```
import numpy as np
import matplotlib
from matplotlib import pyplot as plt

class DualNumber(object):
    """
    Dual numbers have the form z = a + be
    """
    def __init__(self, a, b):
        self.a = a
        self.b = b

    def __repr__(self):
        return str(self.a) + " + " + str(self.b) + " * e"

    def __add__(self, other):
        if not isinstance(other, DualNumber):
            new_other = DualNumber(other, 0)
        else:
            new_other = other
        return DualNumber(self.a + new_other.a, self.b + new_other.b)

    def __mul__(self, other):
        if not isinstance(other, DualNumber):
            new_other = DualNumber(other, 0)
        else:
            new_other = other
        return DualNumber(self.a * new_other.a, self.a * new_other.b + self.b * new_other.a)

def derivative(f):
    def f_prime(x):
        f_x_plus_epsilon = f(DualNumber(x, 1))
        deriv = f_x_plus_epsilon.b
        return deriv
    return f_prime

def f(x):
    return x * x * x

fp = derivative(f)

x = np.linspace(-2, 2, num=1000)
y = f(x)
yp = [fp(xi) for xi in x]  # Unfortunately we can't vectorise here

fig = plt.figure()
ax = fig.add_subplot(1, 1, 1)
ax.plot(x, y, label=r'$f(x) = x^3$')
ax.plot(x, yp, label=r"$f' (x) = 3x^2$")
ax.legend()
plt.show()
```

Fin.
