var isIe = (navigator.userAgent.toLowerCase().indexOf("msie") != -1 || navigator.userAgent.toLowerCase().indexOf("trident") != -1);

var sentenceDepth = 0;
var initIndent = 0;
var treeDiagram = null;
var $diagram = null;

$(document).ready(function(){
    $diagram = $(".diagram");
});

function pasteThings(things)
{
    var words = things.replace(/(\d+)/g,' <sup>$1</sup>').trim().split(" ");
    paragraph = $("<p>").addClass("sentence");
    $.each(words, function(i, word) {
        paragraph.append($("<span>").addClass("word").html(word + " "));
    });
    $diagram.empty().append(paragraph);
    labelLine(paragraph);
    treeDiagram = new Diagram($(".word").toArray());
}
$(document).on("paste", function(e){
    var textFromClipboard = "";
    if (isIe) {
        textFromClipboard = window.clipboardData.getData('Text');
    } else {
        textFromClipboard = e.originalEvent.clipboardData.getData('text/plain');
    }
    if (true)//confirm('paste?'))
        pasteThings(textFromClipboard);
    e.preventDefault();
}).on("contextmenu", ".word", function (e) {
    domControlRemoveClause(this);
    e.preventDefault();
    return false;
}).on("click", ".word", function(){
    domControlAddClause(this);
}).on("draginit", ".sentence", function( ev, dd ){
    initIndent = parseInt($(this).css("paddingLeft"), 10);
}).on("drag", ".sentence", function( ev, dd ){
    $(this).css({ paddingLeft: initIndent + Math.round( dd.offsetX / 30 ) * 30 });
});

function labelLine($clause)
{
    var indexOffset = $clause.prevAll("[data-line-name]").first().index();
    indexOffset = indexOffset > -1 ? indexOffset : 0;
    var thisIndex = $clause.index();
    if (typeof $clause.attr("data-line-name") !== "undefined")
        indexOffset = thisIndex;
    $clause.attr("data-line-index", String.fromCharCode(97 + thisIndex - indexOffset));

    var $firstChild = $clause.children(":first");
    var name = $firstChild.text().match(/^\d+/);
    if (name !== null)
    {
        $clause.attr("data-line-name", name);
        $clause.attr("data-line-index", "a");
        indexOffset = thisIndex;
        $firstChild.text($firstChild.text().replace(/^\d+(.*)/, "$1"));
    }
    if ($clause.next("[data-line-name]").length === 0)
    {
        $clause.nextUntil("[data-line-name]").each(function(i, el){
            console.log(i);
            $(el).attr("data-line-index", String.fromCharCode(97 + thisIndex + i + 1 - indexOffset));
        });
    }
}

function domControlRemoveClause(that)
{
    var clauseIndex = $(that).parent().index();
    // var clauseIndex = $diagram.children().index($(that).parent());
    var elementIndex = $(that).index();
    var currentP = $(that).parent();
    var targetP = $(that).parent().prev();
    if (targetP.length > 0)
    {
        if (typeof currentP.attr("data-line-name") !== "undefined")
            $(that).prepend($("<sup>").text(currentP.attr("data-line-name")));
        targetP.append($(that).siblings().andSelf().detach());
        treeDiagram.mergeClauseBackward(clauseIndex, elementIndex);
        currentP.remove();
        labelLine(targetP.next());
    }
}
function domControlAddClause(that)
{
    var clauseIndex = $(that).parent().index();
    var elementIndex = $(that).index();
    var currentP = $(that).parent();
    var newP = $("<p>").addClass("sentence");
    if ($(that).prevAll().length > 0)
    {
        newP.append($(that).nextAll().andSelf().detach()).insertAfter(currentP);
        newP.css({ paddingLeft: currentP.css("paddingLeft") });

        labelLine(newP);

        treeDiagram.splitClause(clauseIndex, elementIndex);
    }
    console.log(treeDiagram);
}
