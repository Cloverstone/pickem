function render(template, data){
	if(typeof templates[template] === 'undefined'){
		templates[template] =  Hogan.compile($('#'+template).html());
	}
  return templates[template].render(data, templates);
}


debug=true;
alert = function(value){ if(debug){console.log(value);} };


modal = function(options) {
	$('#myModal').remove();
	this.ref = $(render('modal', options));

	options.legendTarget = this.ref.find('.modal-title');
	options.actionTarget = this.ref.find('.modal-footer');

	$(this.ref).appendTo('body');

	if(options.content) {
		$('.modal-body').html(options.content);
		options.legendTarget.html(options.legend);
	}else{
		options.autoDestroy = true;
		var myform = this.ref.find('.modal-body').berry(options).on('destroy', $.proxy(function(){
			this.ref.modal('hide');
		},this));

		this.ref.on('shown.bs.modal', $.proxy(function () {
			this.$el.find('.form-control:first').focus();
		},myform));
	}
	if(options.onshow){
		this.ref.on('shown.bs.modal', options.onshow);
	}  
	this.ref.modal();
	return this;
};




