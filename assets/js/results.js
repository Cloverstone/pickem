window.onload =function(){
	templates['comment'] = Hogan.compile(`<li  class="list-group-item">{{content}}!</li>`);
	$('.form').berry({actions:false,fields: [{name:'content',label:false}]}).on('save',function(){
		socket.emit('message', {group:'Us',content: this.toJSON().content});
		this.fields.content.update({value:''});
		this.fields.content.focus();

	})
}