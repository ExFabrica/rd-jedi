
const getSeoWarningLevelColor = () => {
    let color_tab = ['alternative200', 'danger100', 'primary200', 'secondary200'];
    const date = new Date();
    let index = date.getDay() % 4;
    return color_tab[index];
    // return 'alternative200';
}
const getSeoErrorLevelColor = ()=>  'danger200'

const getBadgeTextColor = ( backgroundColor) => ['600', '700', '800', '900'].some(i => backgroundColor.includes(i)) ? 'neutral0' : 'neutral900'

module.exports ={ getSeoWarningLevelColor,getSeoErrorLevelColor, getBadgeTextColor}