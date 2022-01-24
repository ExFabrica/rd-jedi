const getSeoErrorLevelColor=()=>{
    let color_tab=['alternative200','danger100','primary200','secondary200'];
    const date = new Date();
    let index = date.getDay()%4;
    return color_tab[index];
}
export default getSeoErrorLevelColor;