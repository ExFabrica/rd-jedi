
const getSeoWarningLevelColor = () =>  'danger100'

const getSeoErrorLevelColor = ()=>  'danger200'

const getBadgeTextColor = ( backgroundColor) => ['600', '700', '800', '900'].some(i => backgroundColor.includes(i)) ? 'neutral0' : 'neutral900'

module.exports ={ getSeoWarningLevelColor,getSeoErrorLevelColor, getBadgeTextColor}