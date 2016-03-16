function render(template, data){
	if(typeof templates[template] === 'undefined'){
		templates[template] =  Hogan.compile($('#'+template).html());
	}
  return templates[template].render(data, templates);
}


debug=true;
alert = function(value){ if(debug){console.log(value);} };


window.onload =function(){
			var n = [];
			var min = 17-data.length;
			var max = 16;

			// var min = 1;
			// var max = data.length;
			for(var i=min;i<=max;i++){
				n.push(i);
			}
			$('.games').html(templates['available'].render({values: n}));
	if($('#form').length){
		$('#form').berry({
			actions:['save'],
			default:{type: 'gamePick', min: min, max: max, default:{label: 'Choose', value: 0}, required: true},
			attributes: _.keyBy(picks, 'id'), 
			fields: data 
		}).on('change', function(){

			$('.games span').removeClass('text-success text-danger');
			this.usedValues = _.values(_.mapValues(this.toJSON(), function(o) { return parseInt(o.points, 10); }));
			this.usedValues.map(function(value){
				if(!$('.games #point'+value).hasClass('text-danger')){
				if($('.games #point'+value).hasClass('text-success')){
					$('.games #point'+value).removeClass('text-success');
					$('.games #point'+value).addClass('text-danger');
				}else{
					$('.games #point'+value).addClass('text-success');
				}
				}

			});
			if(!this.valid){
				this.validate();	
			}
		}).on('save', function(){
			console.log(_.values(this.toJSON(null, true)))
		}).trigger('change');
	}
}

var available = `<div>{{#values}}<span class="cube" id="point{{.}}">{{.}}</span>{{/values}}</div>`;
templates['available'] = Hogan.compile(available, templates);


var gamePick = `
<div class="row clearfix {{modifiers}}" name="{{id}}" data-type="{{type}}" style="margin-bottom: 1px;padding:5px">
	<div class="col-md-5" style="text-align:right">
		<div class="btn btn-none" data-value="{{{away}}}" style="width: 200px;line-height: 20px;"><span class="awayteam">{{{away}}}</span><span class="cube team-icon {{away}}" style="margin:-5px;float:right"></span></div>
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
		<div class="btn btn-none" data-value="{{{home}}}" style="width: 200px;line-height: 20px;"><span class="cube team-icon {{home}}" style="margin:-5px;float:left"></span><span class="hometeam">{{{home}}}</span></div>
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
			defaultClass: 'btn-none',
		},
		setup: function() {
			this.$el = this.self.find('select');
			this.$el.off();
			if(this.onchange !== undefined) {
				this.on('change', this.onchange);
			}
			this.$el.change($.proxy(function(){this.trigger('change');}, this));

			this.self.find('.btn').off();
			this.self.find('.btn').on('click', $.proxy(function(e){

				if(!$(e.target).closest('.btn').hasClass(this.selectedClass)){
					this.self.find('.' + this.selectedClass).toggleClass(this.selectedClass + ' ' + this.defaultClass);
				}
				$(e.target).closest('.btn').toggleClass(this.selectedClass + ' ' + this.defaultClass);
				if(typeof this.onchange === 'function'){
					this.onchange();
				}
				this.trigger('change');
			}, this));
		},
		getValue: function() {
			return {
				points: this.$el.val(), 
				pick: this.self.find('.' + this.selectedClass).attr('data-value'),
				id: this.id
			}; 
		},
		setValue: function(value) {
			this.value = value;
			this.$el.val(value.points)
			this.self.find('[data-value="'+value.pick+'"]').click();
		},
		displayAs: function() {
			for(var i in this.item.options) {
				if(this.item.options[i].value == this.lastSaved) {
					return this.item.options[i].label;
				}
			}
		},
		focus: function(){
			this.self.find('[type="radio"]:checked').focus();
		},
		satisfied: function(){

			return (this.self.find('.' + this.selectedClass).length >0) && (this.$el.val() > 0) && (_.countBy(this.owner.usedValues, _.identity)[this.$el.val()] <= 1) //this.$el.is(':checked');
		},
	});
})(Berry, jQuery);
