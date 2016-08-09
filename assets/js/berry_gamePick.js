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
			debugger;
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
