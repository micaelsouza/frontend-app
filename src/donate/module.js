import Config             from './config.js'
import Service            from './service.js'
import DonateEvent        from './controller/donate.event.js'
import DonateCard         from './controller/donate.card.js'
import DonateCardSuccess  from './controller/donate.card.success.js'
import DonateBillet       from './controller/donate.billet.js'
import DonateImpulse      from './controller/donate.impulse.js'

export default angular
  .module('donate', [])
  .config(Config)
  .controller('DonateEvent', DonateEvent)
  .controller('DonateCard', DonateCard)
  .controller('DonateCardSuccess', DonateCardSuccess)
  .controller('DonateBillet', DonateBillet)
  .controller('DonateImpulse', DonateImpulse)
  .service('DonateService', Service)
