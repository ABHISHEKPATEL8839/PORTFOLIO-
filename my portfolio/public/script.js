const skills=[

{name:"HTML5",icon:"fa-brands fa-html5",level:90},

{name:"CSS3",icon:"fa-brands fa-css3-alt",level:85},

{name:"JavaScript",icon:"fa-brands fa-js",level:80},

{name:"Bootstrap",icon:"fa-brands fa-bootstrap",level:85},

{name:"React",icon:"fa-brands fa-react",level:70},

{name:"C#",icon:"fa-solid fa-code",level:75},

{name:"ASP.NET MVC",icon:"fa-solid fa-laptop-code",level:70},

{name:"ASP.NET Core Web API",icon:"fa-solid fa-server",level:70},

{name:"SQL Server",icon:"fa-solid fa-database",level:65}

];

const container=document.getElementById("skills");

skills.forEach(skill=>{

container.innerHTML+=`

<div class="col-md-4 col-lg-3">

<div class="skill-card skill-animate">

<i class="${skill.icon} skill-icon"></i>

<h6 class="mt-2">${skill.name}</h6>

<div class="progress mt-3">

<div class="progress-bar progress-bar-striped progress-bar-animated bg-primary"
style="width:${skill.level}%">

${skill.level}%

</div>

</div>

</div>

</div>

`;

});