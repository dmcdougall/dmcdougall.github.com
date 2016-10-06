---
layout: post
title: Improving matplotlib turnaround time with IPython
date: 2014-02-15 19:15:18.000000000 -06:00
---
When I produce a plot, I'm working in `vim` on a `python` script that I can save and reuse later for reproducibility.  My workflow goes something like this:

1. Write some basic plotting script and have the script save the plot as a `pdf` file.
2. Run the script.
3. Open the plot and decide something needs tweaking (colours, fonts, labels, etc).
4. Go back to `vim` and make the tweak.  Save the script.
5. Re-run the script.
6. Go to 3.

I do this until I am satisfied my plot will look nice in my paper/slides/poster.  This is kind of a pain.  It takes a lot of time because I'm a perfectionist when it comes to plotting.

Using the matplotlib GUI backends interactively from an IPython session means I can tweak my plot and get immediate visual feedback.  This makes steps 3. and 4. above (sans `vim`) much quicker.  I can also save my plot from the GUI as whatever file type I like.  The downside is once I save the plot from the GUI and close my IPython session, I have lost all the commands that created the plot.  I've lost the reproducibility.

This is what a typical session might look like:

```
In [1]: import matplotlib
 
In [2]: matplotlib.use('qt4agg')
 
In [3]: import matplotlib.pyplot as plt
 
In [4]: plt.ion()
 
In [5]: fig = plt.figure()
 
In [6]: ax = fig.add_subplot(1, 1, 1)
 
In [7]: ax.plot([1, 2, 3])
Out[7]: [<matplotlib.lines.Line2D at 0x11178f5d0>]
 
In [8]: plt.draw()  # Now look at the plot, decide tweaks

In [9]: # Some tweak here...

In [10]: plt.draw()  # Look again.  Decide it's ok.

In [11]: plt.savefig('high_quality.pdf')

In [12]: # End session
Do you really want to exit ([y]/n)?
```

To recover the reproducibility aspect, I'd like to be able to save everything I did to a file (a python script I can re-run later to reproduce the figure).

Turns out, there's an `IPython` [magic function that does this](http://stackoverflow.com/a/947846) that I didn't know about.  Here's what a typical `IPython` session would look like using the `%save` magic:

```
In [1]: import matplotlib
 
In [2]: matplotlib.use('qt4agg')
 
In [3]: import matplotlib.pyplot as plt
 
In [4]: plt.ion()
 
In [5]: fig = plt.figure()
 
In [6]: ax = fig.add_subplot(1, 1, 1)
 
In [7]: ax.plot([1, 2, 3])
Out[7]: [<matplotlib.lines.Line2D at 0x11178f5d0>]
 
In [8]: plt.draw()  # Now look at the plot, decide tweaks

In [9]: # Some tweak here...

In [10]: plt.draw()  # Look again.  Decide it's ok.

In [11]: plt.savefig('high_quality.pdf')

In [12]: %save plotting_script.py 1-11
```

Now I have all the commands I ran in the `plotting_script.py`.  I can rerun this and produce exactly the same plot.
