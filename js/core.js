var isIe = (navigator.userAgent.toLowerCase().indexOf("msie") != -1 || navigator.userAgent.toLowerCase().indexOf("trident") != -1);

var sentenceDepth = 0;
var initIndent = 0;

$(document).ready(function(){
})

function pasteThings(things)
{
    var words = things.replace(/(\d+)/g,' $1').trim().split(" ");
    paragraph = $("<p>").addClass("sentence");
    $.each(words, function(i, v) {
        paragraph.append($("<span>").addClass("word").text(v + " "));
    });
    $(".diagram").empty().append(paragraph);
}
$(document).on("paste", function(e){
    if (isIe) {
        var textFromClipboard = window.clipboardData.getData('Text');
    } else {
        var textFromClipboard = e.originalEvent.clipboardData.getData('text/plain');
    }
    if (true)//confirm('paste?'))
        pasteThings(textFromClipboard);
    e.preventDefault();
}).on("contextmenu", ".word", function () {
    var targetP = $(this).parent().prev();
    if (targetP.length > 0)
    {
        targetP.append($(this).siblings().andSelf().detach());
    }
    return false;
}).on("click", ".word", function(){
    var currentP = $(this).parent();
    var newP = $("<p>").addClass("sentence");
    if ($(this).prevAll().length > 0)
        newP.append($(this).nextAll().andSelf().detach()).insertAfter(currentP);
}).on("draginit", ".sentence", function( ev, dd ){
    initIndent = parseInt($(this).css("paddingLeft"), 10);
}).on("drag", ".sentence", function( ev, dd ){
    $(this).css({ paddingLeft: initIndent + Math.round( dd.offsetX / 30 ) * 30 });
});
