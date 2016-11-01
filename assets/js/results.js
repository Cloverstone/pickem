window.onload =function(){
	$('.nav-tabs li a').first().tab('show')
	$('.visible-xs-block.nav-tabs li a').first().tab('show')

	templates['comment'] = Hogan.compile(`<li  class="list-group-item" style="color:{{user.color}}">{{{content}}}</li>`);
	$('.form').berry({/*actionTarget:$('.trash-talk h3 span'),*/ actions:['save',''],fields: [{type:'textarea', name:'content',label:false}]}).on('save',function(){
		socket.emit('message', {group:'Us',content: this.toJSON().content});
		this.fields.content.update({value:''});
		this.fields.content.focus();

	})

	  $('body').on('click', '.nav.btn-group a',function (e) {
    e.preventDefault()        
    debugger;
    $($(this).attr('href')).tab('show')
  })
}