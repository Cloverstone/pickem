function render(template, data){
	if(typeof templates[template] === 'undefined'){
		templates[template] =  Hogan.compile($('#'+template).html());
	}
  return templates[template].render(data, templates);
}


debug=true;
alert = function(value){ if(debug){console.log(value);} };



window.onload =function(){
	if($('#form').length){
		$('#form').berry({default:{type: 'gamePick', min: 1, max: data.length}, fields: data });
	}
}


var gamePick = `
<div class="row clearfix {{modifiers}}" name="{{id}}" data-type="{{type}}" style="background:#fefefe;border-bottom:solid 1px #888;padding:5px">
	<div class="col-md-5" style="text-align:right">
		<div class="btn btn-default" data-value="{{{away}}}" style="width: 200px;line-height: 26px;">{{{away}}}<span class="cube team-icon {{away}}" style="margin:-2px;float:right"></span></div>
	</div>
	<div class="col-md-2" >
	<select class="form-control"  name="{{id}}" {{^isEnabled}}readonly disabled="true"{{/isEnabled}}  {{#multiple_enable}}multiple{{/multiple_enable}} >
	{{#options}}
		<option {{#selected}}selected='selected'{{/selected}} value="{{value}}">
			{{label}}
		</option>
	{{/options}}
	</select>
	</div>
	<div class="col-md-5" style="text-align:left">
		<div class="btn btn-default" data-value="{{{home}}}" style="width: 200px;line-height: 26px;"><span class="cube team-icon {{home}}" style="margin:-2px;float:left"></span>{{{home}}}</div>
	</div>
</div>`;

templates['berry_gamePick'] = Hogan.compile(gamePick, templates);

(function(b, $){
	b.register({ type: 'gamePick',
		create: function() {
			this.options = b.processOpts.call(this.owner, this.item, this).options;
			return b.render('berry_' + (this.elType || this.type), this);
		},
		defaults: {
			selectedClass: 'btn-success',
			defaultClass: 'btn-default',
		},
		setup: function() {
			this.$el = this.self.find('select');
			this.$el.off();
			if(this.onchange !== undefined) {
				this.on('change', this.onchange);
			}
			this.$el.change($.proxy(function(){this.trigger('change');}, this));


			// this.$el = this.self;
			this.self.find('.btn').off();
			this.self.find('.btn').on('click', $.proxy(function(e){
				this.self.find('.' + this.selectedClass).toggleClass(this.selectedClass + ' ' + this.defaultClass);
				$(e.target).closest('.btn').toggleClass(this.selectedClass + ' ' + this.defaultClass);
				if(typeof this.onchange === 'function'){
					this.onchange();
				}
				this.trigger('change');
			}, this));



		},
		getValue: function() {
			// var selected = this.self.find('[type="radio"]:checked').data('label');
			// for(var i in this.item.options) {
			// 	if(this.item.options[i].label == selected) {
			// 		return this.item.options[i].value;
			// 	}
			// }
			return {points: this.$el.val(), pick: this.self.find('.' + this.selectedClass).attr('data-value')}; 
		},
		setValue: function(value) {
			this.value = value;
			this.self.find('[value="' + this.value + '"]').prop('checked', true);
		},
		// 		getValue: function() {
		// 	return this.$el.children('.' + this.selectedClass).attr('data-value');
		// },
		// setValue: function(val) {
		// 	return this.$el.children('[data-value="'+val+'"]').click();
		// },
		displayAs: function() {
			for(var i in this.item.options) {
				if(this.item.options[i].value == this.lastSaved) {
					return this.item.options[i].label;
				}
			}
		},
		focus: function(){
			this.self.find('[type="radio"]:checked').focus();
		}
	});
})(Berry, jQuery);
