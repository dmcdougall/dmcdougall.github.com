---
layout: post
title: 'Publication-ready the first time: Beautiful, reproducible plots with Matplotlib'
date: 2013-11-07 00:02:25.000000000 -06:00
---
First things first, mad props to [Rhys Ulerich](http://agentzlerich.blogspot.com/) for coming up with this title.

In my [last post](http://damon-is-a-geek.com/getting-started-with-matplotlib.html), I gave a very brief introduction into [matplotlib](http://matplotlib.org).  This time I'd like to cover some of the more finicky details.  Details that pertain to making figures look good in your journal publications.

We'll cover three main aspects of plot aesthetics.  First, font size.  Optimising font size is crucial to making your figures look the part in journals.  Second, when the fonts in your plots don't match the fonts in the main body text, the flow of the document becomes jarring.  We'll talk about how to fix that.  Third, tick marks.  Usually, figures need to be shrunk down to fit in a page nicely.  Adjusting the number of tick marks can make your figures look a lot less busy.  We'll also go over optimising the physical size of your graphics so that the effect of shrinking your figures down to fit in the page doesn't undo all the hard work you just put in to make your graphs look good.

To wrap up, I'm going to try package all these touches into a single file.  This should make it easy to create reproducible figures.

### Font size

The first thing to notice is that the font size will need some adjust for most journals.  Usually, printed font size is around `10pt` or `11pt`.  Setting the font size of the various text elements in your plots is, of course, a matter of personal preference.  That said, I tend to make the font size in my figures one size smaller than that of the text in the main body of the article.  Your journal's website should tell you what font size they use.

There are three main font elements in a matplotlib figure; the axes labels; tick labels; and the text inside a legend.  The most common way to adjust these is to manipulate the `rcParams` dictionary.  In the following example python code, we set the font size of each of these elements to `9pt`.

```
from matplotlib import rcParams
rcParams['axes.labelsize'] = 9
rcParams['xtick.labelsize'] = 9
rcParams['ytick.labelsize'] = 9
rcParams['legend.fontsize'] = 9
```

As long as you remember to do this before saving the figure, you should see the changes.  I usually leave all the `rcParams` related foo at the top of my script, just to keep it all in one place.

### Typeface

Probably the most important issue is the font the is used in the typesetting of your figure's text elements.  By default, matplotlib does not use the ubiquitous Computer Modern Roman font.  In fact, by default, it does not even use `LaTeX` to typeset the text.  To do so, see the following:

```
from matplotlib import rcParams
rcParams['font.family'] = 'serif'
rcParams['font.serif'] = ['Computer Modern Roman']
rcParams['text.usetex'] = True
```

A lot of journals use Computer Modern Roman, but some don't.  Times is a commonly used font.  Using a nondefault font is a little more tricky and I will address that later.

### Adjusting the number of ticks

When figures get shrunk down to fit inside a column of a journal article, it might be worth adjusting the number of ticks there are on the y-axis.  Matplotlib tries to be clever and gives you a 'nice-looking' number of ticks, but sometimes it doesn't cut the mustard.  To fiddle around, you'll need to play with a `ticker` object.  We'll use a convenience ticker called `MaxNLocator`:

```
from matplotlib.ticker import MaxNLocator
my_locator = MaxNLocator(6)

# Set up axes and plot some awesome science

ax.yaxis.set_major_locator(my_locator)
```

The number `6` just says, "give me no more than 6 ticks, and give them to me
at nice locations".  It doesn't actually say that, I just look at code so long
all day I feel like it starts talking to me.  Coffee helps.

### The figure size

This is probably the most important of all the setting mentioned so far.  Setting the physical figure dimensions appropriately will mean that your graphs aren't 'shrunk down' to fit into your papers.  This means font sizes will stay true to their set values.  This is also the most finicky setting.

We will optimise figure dimensions for the specific `LaTeX` document that you are editing your paper in.  Presumably you will be using some journal's custom style file.  We need the width, in points, of where your figure will go.  Add this to your `tex` file to force the compiler to show you the text width:

```
\documentclass{some_journal}

\usepackage{some_packages,here}
% maybe some other preamble goes here

\begin{document}

% some awesome science goes here

\showthe\textwidth  % <-- this tells you the textwidth

% some more awesome science
\end{document}
```

This number will probably be 300--400 pts.  Lets's say 350pt.  The following python code will convert this number to figure dimensions that look aesthetically pleasing:

```
WIDTH = 350.0  # the number latex spits out
FACTOR = 0.45  # the fraction of the width you'd like the figure to occupy
figwidthpt  = WIDTH * FACTOR

inchesperpt = 1.0 / 72.27
golden_ratio  = (np.sqrt(5) - 1.0) / 2.0  # because it looks good

figwidthin  = fig_width_pt * inches_per_pt  # figure width in inches
figheightin = fig_width_in * golden_ratio   # figure height in inches
fig_dims    = [fig_width_in, fig_height_in] # fig dims as a list
```

You can then either set the figure dimensions when creating the figure:

```
fig = plt.figure(figsize=fig_dims)
```

Or you can pre compute `fig_dims` by hand (say it's `7.3` wide by `4.2` high) and set the corresponding entry in the `matplotlibrc` file:

```
figure.figsize : 7.3, 4.2
```

Then, when the time comes to include figures into your document, remember to use the `FACTOR` variable to have your plots scaled properly:

```
\documentclass{some_journal}

\usepackage{some_packages,here,graphicx}
% maybe some other preamble goes here

\begin{document}

% some awesome science goes here

\begin{figure}
\includegraphics[width=0.45\textwidth]{figure.pdf}  % <-- FACTOR = 0.45
\end{figure}

% some more awesome science
\end{document}
```

Now your figures should look good.  This is all personal preference, though.  Feel free to play around and find something you like.

## Putting it all together

Well, those four issues are the ones whose defaults irk me the most, but it's kind of a pain to type out all that code for each plot I do.  Even still, I might be writing several papers at once, each containing several plots.  There's a better way to manage this, and it's to use the `matplotlibrc` file.

As a quick introduction, the keys of the `rcParams` dictionary correspond to entries in the `matplotlibrc` file.  For the issues discussed above, here are the mappings from the `rcParams` dictionary to the entry in the `matplotlibrc` file:

```
# rcParams dict
rcParams['axes.labelsize'] = 9
rcParams['xtick.labelsize'] = 9
rcParams['ytick.labelsize'] = 9
rcParams['legend.fontsize'] = 9
rcParams['font.family'] = 'serif'
rcParams['font.serif'] = ['Computer Modern Roman']
rcParams['text.usetex'] = True
rcParams['figure.figsize'] = 7.3, 4.2

# matplotlibrc file
axes.labelsize  : 9.0  # fontsize of the x any y labels
xtick.labelsize : 9.0  # fontsize of the tick labels
ytick.labelsize : 9.0  # fontsize of the tick labels
legend.fontsize : 9.0
font.family     : serif
font.serif      : Computer Modern Roman
text.usetex     : True  # use latex for all text handling
figure.figsize  : 7.3, 4.2
```

Usually, the `matplotlibrc` file lives in `~/.matplotlib`.  If it doesn't, system-wide defaults are used.  If it does, then that file determines the defaults to be used for all plots you create.  The downside is that it's likely the case, especially if you're working on more than one paper, that you'd like a different set of defaults to apply to each one.

Enter `rc_file`.  This function takes a path to a file that is treated as a `matplotlibrc` file.  Now you can keep your default settings in one place for each journal.  Moreover, if you submit any new papers to that journal, all your plots will look the same across multiple papers.  Just copy the matplotlib defaults, from [here](http://matplotlib.org/users/customizing.html#matplotlibrc-sample), override with your defaults, and then stick the following at the top of your plotter:

```
from matplotlib import rc_file
rc_file('/path/to/my/rc/file.rc')  # <-- the file containing your settings
import matplotlib.pyplot as plt

fig = plt.figure()

# plot some awesome science

fig.tight_layout(pad=0.1)  # Make the figure use all available whitespace
fig.savefig('awesome_science.pdf')
```

Notice the use of `tight_layout`, which makes the figure use all the available whitespace.

Now all your plots will look the same, every time, and for every journal.  Your plots are now reproducible.
