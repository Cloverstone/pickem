window.onload =function(){
	templates['comment'] = Hogan.compile(`<li  class="list-group-item">{{user}} - {{{content}}}</li>`);
	$('.form').berry({/*actionTarget:$('.trash-talk h3 span'),*/ actions:['save',''],fields: [{type:'textarea', name:'content',label:false}]}).on('save',function(){
		socket.emit('message', {group:'Us',content: this.toJSON().content});
		this.fields.content.update({value:''});
		this.fields.content.focus();

	})
}