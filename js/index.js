const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
            .attr('width', barWidth)
            .attr('height', height);

const scatterPlot  = d3.select('#scatter-plot')
            .attr('width', width)
            .attr('height', height);

const lineChart = d3.select('#line-chart')
            .attr('width', width)
            .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'gdp';
let highlighted = '';
let selected;

const x = d3.scaleLinear().range([margin*2, width-margin]);
const y = d3.scaleLinear().range([height-margin, margin]);

const xBar = d3.scaleBand().range([margin*2, barWidth-margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height-margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height-margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height-margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin*2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height - margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d=>d.region)).values());

    d3.select('#range').on('change', function(){
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function () {
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function () {
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function () {
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function () {
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function () {
        lineParam = d3.select(this).property('value');
        updateLinearPlot();
    });


    function updateBar(){
        let regions = d3.map(data, d => d['region']).keys();
        var values = regions
            .map(r => d3.mean(data.filter(d => d.region === r)
                .flatMap(d => d[param][year])));

        var barData = [];
        regions.forEach((r, index) =>
            barData.push({'keyR': r, 'keyAvg': values[index]})
        )

        const xBar = d3.scaleBand().range([margin * 2, barWidth - margin]).padding(0.1).domain(regions);
        const yBar = d3.scaleLinear().range([height - margin, margin]).domain([d3.min(values), d3.max(values)])

        xBarAxis.call(d3.axisBottom().scale(xBar));
        yBarAxis.call(d3.axisLeft().scale(yBar));

        barChart.selectAll('rect').remove();

        barChart.append("g").selectAll("rect").data(barData)
            .enter().append("rect")
            .attr('x', d => xBar(d.keyR))
            .attr('y', d => yBar(d.keyAvg) - 30)
            .attr('fill', d => colorScale(d.keyR))
            .attr('height', d => 500 - yBar(d.keyAvg))
            .attr('width', '90')
            .attr('reg', d => d.keyR)
            .on('click', function () {
                barChart.selectAll('rect')
                    .style('opacity', '0.5');
                d3.select(this).style('opacity', '1');
                updateScatterPlot(reg = d3.select(this).attr('reg'))
            })
    }

    function updateScatterPlot(region = '') {
        scatterPlot.selectAll('circle').remove()

        var x = d3.scaleLinear().range([margin * 2, width - margin]).domain([d3.min(data, d => +d[xParam][year]), d3.max(data, d => +d[xParam][year])]);
        var y = d3.scaleLinear().range([height - margin, margin]).domain([d3.min(data, d => +d[yParam][year]), d3.max(data, d => +d[yParam][year])]);

        xAxis.call(d3.axisBottom().scale(x));
        yAxis.call(d3.axisLeft().scale(y));

        const radiusScale = d3.scaleSqrt().range([10, 30]).domain([d3.min(data, d => +d[rParam][year]), d3.max(data, d => +d[rParam][year])]);


        scatterPlot.append("g").selectAll("circle").data(data)
            .enter().append("circle").attr('r', d => radiusScale(d[rParam][year]))
            .attr('cx', d => x(d[xParam][year]))
            .attr('cy', d => y(d[yParam][year]))
            .attr('fill', d => colorScale(d.region))
            .attr('country', d => d.country)
            .on('click', function () {
                selected = d3.select(this).attr('country');
                countryName.html(selected);
                updateLinearPlot();
                scatterPlot.selectAll('circle').style('opacity', '0.65');
                scatterPlot.append('circle').attr('r', d3.select(this).attr('r'))
                    .attr('cx', d3.select(this).attr('cx'))
                    .attr('cy', d3.select(this).attr('cy'))
                    .attr('fill', d3.select(this).attr('fill'))
                    .style('opacity', '1')
            });

        if (region !== '') {
            scatterPlot.selectAll('circle')
                .filter(d => d.region !== region).style('visibility', 'hidden')
        }
    }

    function updateLinearPlot() {
        lineChart.selectAll('path').remove()

        if (selected !== '') {
            let country = data.filter(c => c.country === selected)
                .map(c => Object.values(c[lineParam]));
            
            let lineData = [];
            let year = d3.range(1800, 2021).map(y => new Date(y, 0));

            year.forEach((y, index) =>
                lineData.push({'keyY': y, 'keyV': Number(country[0][index])})
            );

            var x = d3.scaleTime()
                .domain([d3.min(lineData, function (d) {
                    return +d.keyY
                }), d3.max(lineData, function (d) {
                    return +d.keyY
                })])
                .range([margin * 2, width - margin]);

            var y = d3.scaleLinear()
                .domain([d3.min(lineData, function (d) {
                    return +d.keyV
                }), d3.max(lineData, function (d) {
                    return +d.keyV
                })])
                .range([height - margin, margin]);


            xLineAxis.call(d3.axisBottom().tickFormat(d3.timeFormat("%Y")).scale(x))
            yLineAxis.call(d3.axisLeft().scale(y))


            lineChart.append('g')
                .append('path')
                .datum(lineData)
                .attr('stroke', 'blue')
                .attr('stroke-width', 1.5)
                .style('fill', 'none')
                .attr('d', d3.line()
                    .x(d => x(d.keyY))
                    .y(d => y(d.keyV)))


        }
    }

    updateBar();
    updateScatterPlot();
});


async function loadData() {
    const data = { 
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };
    
    return data.population.map(d=>{
        const index = data.gdp.findIndex(item => item.geo === d.geo);
        return  {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}