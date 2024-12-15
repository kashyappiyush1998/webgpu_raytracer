const output_label : HTMLElement = <HTMLElement> document.getElementById("compatibility-check");

if (navigator.gpu) {
    output_label.innerText = "This browser supports WebGPU";
}
else {
    output_label.innerText = "This browser does not supports WebGPU";
}