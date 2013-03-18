function initEffects() {
    var slideObj = new Fx.Slide('hor-minimalist-b');
    //var fadeObj = new Fx.Tween('hor-minimalist-b')
    var preload  = new Image();
    preload.src  = './theme/images/expanded.png';
    $('hor-minimalist-b').setStyle('opacity', 0.0);
    slideObj.hide();
    $('triimg').setStyle('display', 'inline');
    
    $$('#linkcont h3.talk').each(function(el, i) {
	el.setStyle('margin-left', '-15px');
	el.addClass('talkcolor');
    });
    
    $('linkcont').addEvent('click', function(event){
	event.stop();
	if (slideObj.open) {
	    $('triimg').src = './theme/images/collapsed.png';
	    $('hor-minimalist-b').set('tween', {duration: 350});
	    var inout = 0.0;
	}
	else {
	    $('triimg').src = './theme/images/expanded.png';
	    $('hor-minimalist-b').set('tween', {duration: 800});
	    var inout = 1.0;
	}
	slideObj.toggle();
	$('hor-minimalist-b').tween('opacity', inout)
    });
}

window.addEvent('domready', initEffects);
