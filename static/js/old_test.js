// extend prototypes
Array.prototype.unique = function() {
    var self = this;
    return $.grep(self, function(el, index) {
        return index === $.inArray(el, self);
    });
}

// set global variables
var gCy = [],  // Array of NetworkObjects
    gCurNet = null,  // current NetworkObject
    gMenuTemplate,
    gNamedElements = [  // These are the id prefixes that appear in the menu template. They are used to manipulate the corresponding element.
        "simplewrapper",
        "menuwrapper",
        "datasets",
        "unselectcomps",
        "selnav",
        "finput",
        "flabel",
        "ds_custom",
        "selnodes",
        "selhighlight",
        "legend_class",
        "legend_color",
        "cs", "csmin", "csmax", "csfixmin", "csfixmax",
        "cslidemin", "cslidemax",
        "cyfit",
        "extract",
        "extractneighbors",
        "selmarked",
        "snapshot",
        "selsubgraphs",
        "cytoscapecontainer"
    ],
    gNetworkObjectTemplate = function(index, prefix, container) {
        var self = this;
        self.index = index || gCy.length;  // the position in the global array of NetworkObjects
        self.prefix = prefix;  // should be the string that files start with, e.g. "macrophage_map" or "macrophage_network"
        self.cjs = null;  // corresponding Cytoscape.js instance
        var busy = [];
        self.marked = {
            nodes: null,
            edges: null
        }
        self.markedStash = null;
        self.predefStash = null;
        self.topology = null;
        self.ontology = null;
        self.chameleons = {
            nodes: null,
            edges: null
        }
        self.flats = {
            nodes: null,
            edges: null
        }
        self.data = {
            custom: {
                globals: { min_logFC: 0, max_logFC: 0, comparisons: [], changed: false, counter: 0 }
            },
            _requests: [],

            _fetch: function() {
                var data = self.data,
                    queue = self.data._requests.concat([]);  // make a copy of the current state

                queue.forEach(function(x) {
                    if (data.hasOwnProperty(x)) {  // do not fetch more than once
                        data._requests.splice(data._requests.indexOf(x), 1)
                        return;
                    }
                    data[x] = null;  // makes sure that the next hasOwnProperty succeeds and the file is not fetched again
                    self.retrieveJSON(self.prefix + "_" + x + ".cyjs", function(src) {
                        data[x] = JSON.parse(src.responseText);
                        data._requests.splice(data._requests.indexOf(x), 1);
                    });
                });
                clearInterval(data._check);
                data._check = null;
            },
            _check: null
        }
        self.mappers = {
            symbol: null,
        }
        self.assElements = {
            buttons: {},
            selects: {},
            container: container,
            comp: {},
            legend: {}
        }
        self.assMenu,  // reference to this network's HTML menu
        self.comparisons = {
            maxSelectable: 4,  // maximum number of comparisons that can be shown side-by-side
            selected: [],
            selectedDatasets: []
        }
        self.legend = {
            min: 0,
            max: 0,
            curMin: null,
            curMax: null,
            canvasCache: {},
            sliderCache: {},

            // self.legend.method
            updateLimits: function() {
                var mi = [0], ma = [0],  // zero is default
                    c = self.comparisons,
                    i;
                for (i = 0; i < c.selected.length; i++) {
                    var ds = c.selectedDatasets[i];
                    if (self.data.hasOwnProperty(ds)) {
                        mi.push(self.data[ds].globals.min_logFC);
                        ma.push(self.data[ds].globals.max_logFC);
                    }
                }
                this.min = this.curMin = Math.min.apply(null, mi);
                this.max = this.curMax = Math.max.apply(null, ma);
            },

            // self.legend.method
            updateColorStripe: function(force) {
                // mostly copied from https://stackoverflow.com/questions/7221278/javascript-colorbar-best-way-to-create-it

                // make a unique label for the currently selected combination of datasets
                // The 'concat([])' prevents 'sort()' from changing the element order of the original Array.
                var selection = self.comparisons.selectedDatasets.unique().sort().join("§§§");
                if (selection === "" && !force)  return;  // no need to go through the rest if no dataset was selected (`force` parameter blocks return)

                // make sure we are working with the correct limits
                this.updateLimits();

                var cnv = self.assElements.legend.canvas,
                    ctx = cnv.getContext('2d'),
                    mi = this.min, ma = this.max;  // get min and max values of the selected data

                if (this.canvasCache.hasOwnProperty(selection)
                        // additionally check if custom is shown and was changed
                        && !(self.comparisons.selectedDatasets.indexOf("custom") > -1 && self.data.custom.globals.changed)) {
                    ctx.putImageData(this.canvasCache[selection], 0, 0);  // bring up image from cache
                    this.redrawColorSliders.apply(this, this.sliderCache[selection]);  // call function with arguments from cache
                } else {
                    var w = cnv.width,
                        h = cnv.height,
                        step = 5;  // default logical width of a canvas is 300, so any number that evenly divides 300 should be fine
                    if (mi*ma < 0) {  // means opposite signs => three-color stripe
                        mi = Math.abs(mi);  // regard minimum as positive from now on
                        var zero = (mi / (mi + ma) * w) | 0;  // The `| 0` truncates the float to integer and is presumably the fastest general solution for that.
                        zero = Math.min(Math.max(zero, 75), w - 75);  // set minimum width of 75 px for both color areas
                        // left part - blue, i.e. negative values
                        for (var i = 0; i < zero; i += step) {
                            ctx.beginPath();
                            ctx.fillStyle = chroma.mix("white", "blue", (zero - i) / zero).hex();
                            ctx.fillRect(i, 0, step, h);
                        }
                        // right part - red, i.e. positive values
                        for (; i < w; i += step) {
                            ctx.beginPath();
                            ctx.fillStyle = chroma.mix("white", "red", (i - zero) / (w - zero)).hex();
                            ctx.fillRect(i, 0, step, h);
                        }
                        // set dimension-related properties of sliders
                        this.redrawColorSliders(-mi, ma, zero / w);
                        this.sliderCache[selection] = [-mi, ma, zero / w];  // cache limits
                    } else {  // identical signs => two-color stripe
                        if (mi < 0) {
                            for (var i = 0; i < w; i += step) {
                                ctx.beginPath();
                                ctx.fillStyle = chroma.mix("white", "blue", 1 - i / w).hex();
                                ctx.fillRect(i, 0, step, h);
                            }
                            ma = Math.min(ma, -0.1);  // substitute 0
                        } else {
                            for (var i = 0; i < w; i += step) {
                                ctx.beginPath();
                                ctx.fillStyle = chroma.mix("white", "red", i / w).hex();
                                ctx.fillRect(i, 0, step, h);
                            }
                            mi = Math.max(mi, 0.1);  // substitute 0
                        }
                        this.redrawColorSliders(mi, ma);
                        this.sliderCache[selection] = [mi, ma];  // cache limits
                    }
                    this.canvasCache[selection] = ctx.getImageData(0, 0, w, h);  // cache image
                    // unflag changes in custom if it was processed
                    if (self.comparisons.selectedDatasets.indexOf("custom") > -1)
                        self.data.custom.globals.changed = false;
                }
            },

            redrawColorSliders: function(min, max, frac) {
                var sliders = self.assElements.legend.sliders,
                    labels = self.assElements.legend.labels,
                    cnv = self.assElements.legend.canvas;

                // restore default state
                sliders.show();
                labels.show();

                if (frac === void(0)) {  // draw slider for one color
                    // hide the appropriate slider (makes life easier)
                    if (min < 0) {
                        $([sliders[1], labels[3]]).hide();
                        $(labels[2]).text(min.toFixed(1));
                        var sl = 0, vl = min;
                    } else {
                        $([sliders[0], labels[2]]).hide();
                        $(labels[3]).text(max.toFixed(1));
                        var sl = 1, vl = max;
                    }
                    sliders[sl].min = min;
                    sliders[sl].max = max;
                    sliders[sl].value = vl;
                    sliders[sl].style.width = cnv.clientWidth + "px";
                } else {  // draw two sliders for two colors
                    sliders[0].value = sliders[0].min = min;
                    sliders[0].max = -0.1;
                    sliders[1].min = 0.1;
                    sliders[1].value = sliders[1].max = max;

                    // prevent sliders from becoming too tiny
                    var fracLimit = .2;
                    frac = Math.max(Math.min(frac, 1-fracLimit), fracLimit);

                    sliders[0].style.width = (frac * cnv.clientWidth - 8) + "px";
                    sliders[1].style.width = ((1 - frac ) * cnv.clientWidth - 8) + "px";
                    $(labels[2]).text(min.toFixed(1));
                    $(labels[3]).text(max.toFixed(1));
                }
                // change the labels above the color stripe
                $(labels[0]).text("min. " + min.toFixed(1));
                $(labels[1]).text("max. " + max.toFixed(1));
            },

            onSlide: function(evt) {
                var label = $('#' + evt.target.id.replace("cslide", "cs"));
                label.text(evt.target.valueAsNumber.toFixed(1));
            },

            onSlideRelease: function(evt) {
                self.legend.curMin = self.assElements.legend.sliders[0].valueAsNumber;
                self.legend.curMax = self.assElements.legend.sliders[1].valueAsNumber;
                self.updateNodeColors();
            }
        }

        // object methods
        self.retrieveJSON = function(URL, callback) {
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.onreadystatechange = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    callback(xmlhttp);
                }
            }
            xmlhttp.open("GET", URL);
            xmlhttp.overrideMimeType("application/json");
            xmlhttp.send();
        }

        self.createInstance = function(cont, layout, callback) {
            if (!cont) {
                if (gMenuTemplate == void(0)) {
                    if ('content' in document.createElement("template")) {
                        gMenuTemplate = $('#menutemplate')[0];  // can be accessed and modified like a rendered DOM element
                    } else {
                        alert ("This page is not compatible with your browser. Please use a modern browser instead.");

                        return;
                    }
                }
                self.insertHTMLTemplate();
                cont = self.assMenu.querySelector('#cytoscapecontainer_' + (self.index + 1));
            }
            self.assElements.container = cont;
            cont.classList.add("cy");
            self.retrieveJSON(self.prefix + "_topology.cyjs", function(src) {
                self.topology = JSON.parse(src.responseText);
                createDisplay(gCy[self.index], self.topology.elements, self.assElements.container, layout, function(cy) {
                    self.cjs = cy;
                    self.postProcess(callback);
                });
            });
        }

        var busify = function(tag, payload) {
            busy.push(tag);  // extend queue
            if (busy.length == 1) {
                $('html *').addClass("waiting");
                self.cjs.startBatch();  // put Cytoscape.js in batch mode if that has not happened already
                setTimeout(function() {
                    payload();
                    setTimeout(unbusify, 150);
                }, 100);
            } else {
                payload();
                setTimeout(unbusify, 150);
            }
        }

        var unbusify = function() {
            busy.shift();  // shorten queue
            if (!busy.length) {
                self.cjs.endBatch();  // end Cytoscape.js batch mode once the event queue runs empty
                $('html *').removeClass("waiting");
            }
        }

        self.postProcess = function(callback) {

            // local subfunction
            function stepwise() {
                if (i < initOrder.length) {
                    initOrder[i++]();  // Execute next function from `initOrder` array (see below).
                    setTimeout(stepwise, 50);  /* Execute self again with a delay.
                                                  The delay allows for intermittent updates of animated display parts (like loading gifs).*/
                }
            }


            // set up order of function calls
            var i = 0,
                initOrder = [
                    self.buildMenu,
                    self.assignElements,
                    function() {
                        self.mappers.symbol = self.topology.symbol_map;
                        self.marked.nodes = self.cjs.collection();  // initialize with empty graph elements collection
                        // make node collections: one for nodes that can switch color, another for those that cannot
                        self.chameleons.nodes = self.cjs.nodes('[class="PROTEIN"], [class="ANTISENSE_RNA"], [class="GENE"]');
                        self.flats.nodes = self.cjs.nodes().difference(self.chameleons.nodes);
                    },
                    self.addNodeQtips,
                    self.addEdgeQtips,
                    self.populateNodeSelector,
                    self.populateHighlightSelector,
                    self.populateSubgraphSelector,
                ];
            if (typeof callback === "function")  initOrder.push(function() {callback(self)});

            // execute functions
            stepwise();
        }

        self.insertHTMLTemplate = function(index) {
            index = index || self.index + 1;
            var i, p,
                localMenu = gMenuTemplate.content.cloneNode(true);
            localMenu.querySelector('#flabel').htmlFor = 'finput_' + index;  // htmlFor corresponds to the `for` attribute of the label
            for (i = 0; i < gNamedElements.length; i++) {
                p = gNamedElements[i];
                localMenu.querySelector('#' + p).id = p + "_" + index;  // The '_' is important to prevent collisions with names that end on numbers.
            }
            $('#menus')[0].appendChild(document.importNode(localMenu, true));
            self.assMenu = $('#menus')[0].lastElementChild;
        }

        self.buildMenu = function() {
            var i,
                datasets = Object.keys(self.topology.labels).sort(function(a, b) {  // sort according to `~~label` property
                    return self.topology.labels[a]["~~label"].localeCompare(self.topology.labels[b]["~~label"]);
                });
            self.data._sorting = {
                _datasets: datasets
            }
            for (i = 0; i < datasets.length; i++) {
                self.addComparisonsToMenu(datasets[i], self.topology.labels[datasets[i]]);
            }
        }

        self.addComparisonsToMenu = function(dataset, entries) {
            let index = self.index + 1,
                ul = self.assMenu.querySelector('[id^=datasets]'),
                dsname = "ds_" + dataset + "_" + index,
                dsele = self.assMenu.querySelector("#" + dsname);  // try to reference the dataset's <input> element

            if (!entries["~~label"])  return;  // missing or empty label indicates this dataset should be skipped
            if (dsele == null) {  // new dataset -> create new <ul> child
                dsele = ul.children[1].cloneNode(true);  // clone the invisible dataset template <li>
                // find and configure label
                var label = dsele.children[0];
                label.htmlFor = dsname;
                label.innerHTML = " " + entries["~~label"];
                // find and configure input checkbox
                var input = dsele.children[1];
                input.id = dsname;
                // add dataset links to label (if applicable)
                if (entries["~~datasets"]) {
                    let ds = entries["~~datasets"].split(","),
                        ltext = [];
                    for (let i = 0; i < ds.length; i++) {
                        if (ds[i][0] == "G") {  // assume GEO
                            ltext.push('<a target="_blank" href="https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=' + ds[i] + '">' + ds[i] + '</a>');
                        } else if (ds[i][0] == "E") {  // assume ArrayExpress
                            ltext.push('<a target="_blank" href="https://www.ebi.ac.uk/arrayexpress/experiments/' + ds[i] + '">' + ds[i] + '</a>');
                        }
                    }
                    if (ltext.length) {
                        label.innerHTML += " <span>(" + ltext.join(", ") + ")</span>";
                    }
                }
                ul.appendChild(dsele);
            } else {  // existing dataset
                dsele = dsele.parentNode;  // switch from <input> to parent <li>
            }

            // fill menu item with comparison labels in `entries`
            var compUl = dsele.querySelector("ul"),
                liTemplate = compUl.querySelector("li"),  // select first <li> (which is the invisible template)
                liLabel = dsele.querySelector("label");

            let k,
                keys = Object.keys(entries)
                    .sort().slice(0,-2)  // remove `~~label` and `~~datasets`
                    .sort(function(a, b) {  // sort according to entries
                        return entries[a].localeCompare(entries[b]);
                    });
            for (k = 0; k < keys.length; k++) {
                let l = liTemplate.cloneNode(true),  // clone the <li> element and its descendants
                    // hierarchy is: <li><span><img/><input/></span></li>
                    s = l.children[0],  // extract <span> element by taking advantage of the fixed hierarchy
                    text = entries[keys[k]];

                if (!text)  continue;  // skip comparisons that have not been labeled
                $(s).html(function(index, oldhtml) {
                    return oldhtml + " " + text;
                });
                let i = s.children[1];  // extract <input> element by taking advantage of the fixed hierarchy
                i.id = "ds" + index + "_" + keys[k];  // make dataset label available as <input> id
                i.attributes.group.value = dataset;
                i.addEventListener("change", self.compClicker);  // register onchange event
                l.attributes.removeNamedItem("style");  // get rid of invisibility
                compUl.appendChild(l);  // append cloned <li> node to the list
            }
            if (dsele.attributes.hasOwnProperty("hidden"))
                dsele.attributes.removeNamedItem("hidden");  // remove the <li> element's invisibility
            liLabel.classList.add("dataset");  // add necessary behavior
            self.data._sorting[dataset] = keys;
        }

        self.addNodeQtips = function() {
            self.cjs.nodes().qtip({
                content: function(){
                    var cl = this.data("class"),
                        co = this.data("compartment"),
                        btnlabel, btnclass, btndis = "", b;
                    switch(cl) {
                        case "ANTISENSE_RNA":
                            b = '<ul><li>Access <a target="_blank" href="http://www.mirbase.org/cgi-bin/mature.pl?mature_acc=' +
                                this.data("mirbase_mature") + '">miRBase record</a></li>';
                            b += '<li>Access <a target="_blank" href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=' +
                                this.data("hgnc_symbol") + '">GeneCards record</a> (human)</li></ul>';
                            break;
                        case "GENE":
                            b = '<ul>';
                            if (this.data("ensembl") != void(0)) {
                                b += '<li>Access <a target="_blank" href="http://www.identifiers.org/ensembl/' +
                                    this.data("ensembl") + '">Ensembl record</a></li>';
                            }
                            b += '<li>Access <a target="_blank" href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=' +
                                this.data("hgnc_symbol") + '">GeneCards record</a> (human)</li></ul>';
                            break;
                        case "PROTEIN":
                            b = '<ul>';
                            if (this.data("uniprot") != void(0)) {
                                b += '<li>Access <a target="_blank" href="http://www.uniprot.org/uniprot/' +
                                    this.data("uniprot") + '">UniProt record</a></li>';
                            }
                            if (this.data("hgnc_symbol") != void(0)) {
                                b += '<li>Access <a target="_blank" href="https://www.genecards.org/cgi-bin/carddisp.pl?gene=' +
                                    this.data("hgnc_symbol") + '">GeneCards record</a> (human)</li>'
                            }
                            b += '</ul>';
                            break;
                        case "RNA":
                            b = '<ul>See corresponding gene node'; break;
                        case "COMPLEX":
                            b = '<ul>See corresponding subunit nodes'; break;
                        case "DEGRADED":
                            b = '<ul>Regulated breakdown</ul>'; break;
                        default:
                            b = '';
                            break;
                    };
                    if (this.hasClass("marked")) {
                        btnlabel = "Unmark this factor";
                        btnclass = "";
                    } else {
                        btnlabel = "Mark this factor";
                        btnclass = " unmarked";
                    }
                    if (self.markedStash) {
                        btndis = " disabled"
                    }
                    b += "<p><button class='qtip-button-mark" + btnclass + "' network='" + self.index + "'" + btndis + " node='" +
                        this.data("id") + "'>" + btnlabel + "</button></p>";

                    return '<h2>' + this.data("tag") + '</h2>' + 'Class: ' + cl + '<br/>Compartment: ' + co + b;
                },
                position: {
                    my: 'top center',  // This point of the qtip...
                    at: 'bottom center'  // ...will be close to this point of the target.
                },
                style: {
                    classes: 'qtip-bootstrap',
                    tip: {
                        width: 16,
                        height: 8
                    }
                }
            });
            // Because we cannot add an event handler directly to the qtip button, we attach the onclick event to the body and delegate it.
            $(document.body).on("click", "button.qtip-button-mark", self.toggleNodeMark);
        }

        self.addEdgeQtips = function() {
            self.cjs.edges().qtip({
                content: function(){
                    var t = this.data( "type" );
                    var b;
                    if ( this.data( "annotation" ) != "" ) {
                        b = '<ul><li>Access <a target="_blank" href="https://www.ncbi.nlm.nih.gov/pubmed/' + this.data( "annotation" ) + '">PubMed records</a>';
                    } else {
                        b = '<ul><li>No reference available</li>';
                    }
                    return '<h2>' + this.data( "name" ) + '</h2>' + 'Type: ' + t + b;
                },
                position: {
                    my: 'top center',
                    at: 'bottom center'
                },
                style: {
                    classes: 'qtip-bootstrap',
                    tip: {
                        width: 16,
                        height: 8
                    }
                }
            });
        }

        self.populateNodeSelector = function(first = true, resetToFull = false) {
            var s2m_mapper = {},
                s2m_data = [],
                ele = self.assElements.selects.nodes,
                nlabel,
                i,
                classes = ["Gene", "RNA", "Protein", "Antisense_RNA", "Complex", "Simple_Molecule", "Ion", "Phenotype",  // target classes
                            "Degraded"  // bystander classes; necessary during node iteration but ignored later
                            ];

            if (first || !resetToFull) {
                // initialize the data structure that will be the content of the select2 element
                for (i = 0; i < classes.length; i++) {
                    s2m_mapper[classes[i].toUpperCase()] = i;
                    s2m_data.push({ text: classes[i], children: [] });
                }
                // fill the data structure with node data
                var nodes = self.cjs.nodes(),
                    markedNodes = [];
                for (i = 0; i < nodes.length; i++) {
                    n = nodes[i];
                    // initialize data.custom with the ids of all existing nodes
                    // NOTE: This is done here for the sake of speed and convenience
                    // because we are iterating anyway but is otherwise completely
                    // unrelated to the surrounding code.
                    try {
                        self.data.custom[n.data("id")].hasOwnProperty;  // produces error if uninitialized
                    } catch(err) {
                        self.data.custom[n.data("id")] = {};
                    }
                    nlabel = $.trim(n.data("tag"))
                        + " (" + (n.data("hgnc_symbol") == void(0) ? "" : ("<i>" + n.data("hgnc_symbol") + "</i>, "))
                        + n.data("compartment") + ")";
                    s2m_data[s2m_mapper[n.data("class")]].children.push({ id: n.data("id"), text: nlabel });
                    if (n.hasClass("marked"))  markedNodes.push(n.data("id"));  // keep track of marked nodes for the select element
                }
                // sort stuff in the data structure according to the entries' labels
                for (i = s2m_data.length - 1; i > -1; i--) {
                    if (s2m_data[i].children.length == 0 || s2m_data[i].text == "Degraded") {
                        s2m_data.splice(i, 1);  // remove types without any nodes
                    } else {
                        s2m_data[i].children.sort( function(a, b) { return a.text < b.text ? -1 : +(a.text > b.text); } );
                    }
                }
            }
            if (resetToFull) {
                s2m_data = self.fullSelector;
            } else if (first) {
                self.fullSelector = s2m_data;
            }

            // (re-)intialize select2
            ele.empty().select2({  // remove content first, then add new options
                data: s2m_data,
                allowClear: true,
                placeholder: "Center network on factor",
                templateResult: function(x){ return $("<span>" + x.text + "</span>"); },
                templateSelection: function(x){ return $("<span>" + x.text + "</span>"); },
                //renderTitle: false,  // planned for a release after 4.0.0
            });
            ele.val(null).trigger("change");  // vacate initial value (select2 automatically uses either the default or the first one)
            // the select element for node marking is filled with the same data, but it allows multi-selecting nodes due to its `multiple` attribute
            ele = $(self.assElements.selects.marked);
            ele.empty().select2({
                data: s2m_data,
                allowClear: true,
                placeholder: "Mark factors",
                templateResult: function(x){ return $("<span>" + x.text + "</span>"); },
                templateSelection: function(x){ return $("<span>" + x.text + "</span>"); },
                //renderTitle: false,  // planned for a release after 4.0.0
            });
            ele.val(markedNodes).trigger("change");  // restore marked nodes (if there were any)

            // configure select2 options
            ele.next().find('.select2-selection__rendered').attr("title", "");
            /* For some reason, the above does not work with e.g. `ele.attr("title", "")`.
             * Perhaps select2 consists of multiple elements all of whose titles need to be disabled?
             * */
        }

        self.populateHighlightSelector = function() {
            var s = self.assElements.selects.highlight;

            function highlightNodes(term) {
                busify("highlightnodes", function() {
                    self.cjs.nodes()
                        .removeClass("halo")
                        .filter(function(i, ele) {  // find the corresponding nodes...
                            return self.ontology[ele.id()].hasOwnProperty(term);
                        })
                        .addClass("halo");  // ... and highlight them
                });
            }

            s.select2({
                data: self.topology.ontology,
                allowClear: true,
                placeholder: "Highlight factors via GO term or pathway",
                templateResult: function(x){ return $("<span>" + x.text + "</span>"); },
                templateSelection: function(x){ return $("<span>" + x.text + "</span>"); },
                //renderTitle: false,  // planned for a release after 4.0.0
            }).on("select2:select", function(e) {
                s.next().find('.select2-selection__rendered').attr("title", "");
                if (!self.ontology) {  // fetch file
                    self.retrieveJSON(self.prefix + "_ontology.cyjs", function(src) {
                        self.ontology = JSON.parse(src.responseText);
                        highlightNodes(e.params.data.id);
                    });
                } else {
                    highlightNodes(e.params.data.id);
                }
            }).on("select2:unselect", function(e) {
            // remove label and highlight when select2 is cleared
                self.cjs.nodes().removeClass("halo");  // undo highlighting on all nodes
            }).val(null).trigger("change");  // vacate initial value (select2 automatically uses either the default or the first one)
        }

        self.populateSubgraphSelector = function() {
            var i,
                labels = self.topology.labels,
                ds = self.data._sorting._datasets,
                sg = self.topology.subgraphs,
                content = [],
                ele = self.assElements.selects.subgraphs;

            for (i = 0; i < ds.length; i++) {
                let comp = self.data._sorting[ds[i]],
                    validcomp = [];
                for (let j = 0; j < comp.length; j++)
                    if (sg.hasOwnProperty(comp[j]) && labels[ds[i]][comp[j]])  // check if this comparison has both a subgraph and a label
                        validcomp.push({
                            text: labels[ds[i]][comp[j]],
                            id: comp[j]
                        });
                if (validcomp.length)  // only add data sets with at least one subgraph
                    content.push({
                        text: labels[ds[i]]["~~label"],
                        children: validcomp
                    });
            }
            ele.select2({
                data: content,
                allowClear: true,
                placeholder: content.length == 0 ? "No regulatory subnetworks" : "Select regulatory subnetwork",
                templateResult: function(x){ return $("<span>" + x.text + "</span>"); },
                templateSelection: function(x){ return $("<span>" + x.text + "</span>"); },
                //renderTitle: false,  // planned for a release after 4.0.0
            });
            if (content.length == 0) {
                ele.prop("disabled", true);
            } else {
                ele.next().find('.select2-selection__rendered').attr("title", "");
                /* For some reason, the above does not work with e.g. `ele.attr("title", "")`.
                 * Perhaps select2 consists of multiple elements all of whose titles need to be disabled?
                 * */
                ele.on("select2:select select2:unselect", function(e) {
                    ele.next().find('.select2-selection__rendered').attr("title", "");
                    if (e.type == "select2:select")  // prevent collision with the "Extract" button for marked nodes
                        self.assElements.buttons.extract.off("click", self.extractSubnetwork).addClass("disabledbuttonlike");
                    busify("subgraph", function() {
                        var nodes = sg[e.params.data.id].nodes;
                        if (self.predefStash != null) {
                            self.predefStash.restore();  // put nodes back into the network
                            self.predefStash = null;
                            self.cjs.fit();
                        }
                        if (e.type == "select2:select") {
                            self.predefStash = self.cjs.nodes("[id='" + nodes.join("'],[id='") + "']");
                            self.predefStash = self.predefStash.add(self.predefStash.connectedEdges()).absoluteComplement().remove();
                            self.cjs.fit();
                        }
                        self.populateNodeSelector(false, resetToFull = e.type == "select2:unselect");  // only displayed nodes should be selectable
                    });
                    if (e.type == "select2:unselect" && self.marked.nodes.size() > 0)  // conditionally re-enable "Extract" button for marked nodes
                        self.assElements.buttons.extract.on("click", self.extractSubnetwork).removeClass("disabledbuttonlike");
                    // delete highlights
                    self.cjs.nodes().removeClass("halo");
                    self.assElements.selects.highlight.val(null).trigger("change");
                });
                ele.val(null).trigger("change");
            }
        }

        self.assignElements = function(index) {
            index = index || self.index + 1;
            var ele,
                ass = self.assElements;
            // register elements and event handlers
            // ... regulatory core button
            //self.assElements.buttons.cores = $('#cores1');
            //self.assElements.buttons.cores.on("click", self.toggleCores);
            // ... extract marked nodes
            ass.buttons["extract"] = $('#extract_' + index);
            // ... Fit-to-container button
            $('#cyfit_' + index).on("click", function() { self.cjs.fit(); });

            // ... left-hand menu
            ele = ass.comp["selectors"] = $('#selnav_' + index + ' li li input');  // select only second-level inputs (those within two <li> elements)
            ele.attr("checked", false);
            ele.attr("disabled", false);

            // ... Unselect-all button
            ele = ass.comp["unselectall"] = $('#unselectcomps_' + index);
            ele.on("click", function() {
                var eles = ass.comp.selectors;
                busify("unselectall", function() {
                    eles.filter(':checked').trigger("click");  // trigger click event so that the change can propagate to the dependent elements
                });
                eles.attr("disabled", false);
            });

            // ... custom list and file input
            ass.comp["culi"] = $('#ds_custom_' + index)[0].nextElementSibling;  // the <ul> element following the label
            ass.comp["cula"] = $('#flabel_' + index);
            ele = ass.comp["fileinput"] = $('#finput_' + index);
            ele.on("change", self.readLocalFiles);

            // collect <img> elements in selnav
            ass.comp.pieImgs = $('#selnav_' + index + ' img');

            // parts of the legend
            ele = ass.legend;
            ele["canvas"] = $('#cs_' + index)[0];  // the drawing board
            ele["labels"] = $('#csfixmin_' + index + ", #csfixmax_" + index + ", #csmin_" + index + ", #csmax_" + index);  // the slider-associated labels
            ele["class"] = $('#legend_class_' + index)[0];  // the parent of all class-related legend parts
            ele["stripe"] = $('#legend_color_' + index)[0];  // the parent of all color code-related legend parts
            ele["sliders"] = $('#legend_color_' + index + ' input'); // the two input range sliders that allow the setting of custom limits
            ele.sliders.on("input", self.legend.onSlide);  // FF only triggers onchange when the mouse is released.
            ele.sliders.on("change", self.legend.onSlideRelease);  // FF only triggers onchange when the mouse is released.

            // select elements
            ele = ass.selects;
            ele["nodes"] = $('#selnodes_' + index);
            ele.nodes.on("select2:select", function(evt) {
                ele.nodes.next().find('.select2-selection__rendered').attr("title", "");
                self.nodeAnimationEnlarge(evt.params.data.id);
            });
            ele["highlight"] = $('#selhighlight_' + index);
            ele["subgraphs"] = $('#selsubgraphs_' + index);
            ele["marked"] = $('#selmarked_' + index)[0];  // transform and store at the same time
            $(ele.marked).on("select2:select select2:unselect", function(evt) {
                $(ele.marked).next().find('.select2-selection__rendered').attr("title", "");
                self.toggleNodeMark(evt);
            });

            // checkbox for neighborhood extraction
            ass["extractneighbors"] = $('#extractneighbors_' + index)[0];

            $('#snapshot_' + index).on("click", self.saveViewAsImage);
        }

        self.nodeAnimationEnlarge = function(node_id) {
            self.cjs.zoom(1);
            var n = self.cjs.getElementById(node_id);
            self.cjs.center(n);
            var a = n.animation({
                style: {
                    width: 100,
                    height: 100,
                },
                duration: 400,
                easing: 'ease-out-cubic',
                queue: true
            });
            a.play().promise("complete").then(function() {
                a.reverse()  // After this line, `a` is permanently `reverse`d. Another call to `reverse()` would restore the original transition.
                    .play().promise("complete").then(function() {
                        n.style("width", "").style("height", "");  // remove bypass left over from animation
                    });
            });
        }

        self.nodeColor = function(node, cindex, type) {
            type = type || "_logFC";
            if (cindex > self.comparisons.selected.length)  return gColorUndefined;
            var v = self.data[self.comparisons.selectedDatasets[cindex-1]][node.data("id")][self.comparisons.selected[cindex-1] + type];

            if (v === void(0)) {  // no value
                return gColorUndefined;
            } else if (v === 0) {  // always returns white
                return "#ffffff";
            } else if (v > 0) {  // positive value
                return chroma.mix("white", "red", v / self.legend.curMax).hex();
            } else {  // negative value
                return chroma.mix("white", "blue", v / self.legend.curMin).hex();
            }
        }

        self.nodeOpacity = function(node, cindex, type) {
            type = type || "_logFC";
            if (cindex > self.comparisons.selected.length)  return .4;
            return (self.data[self.comparisons.selectedDatasets[cindex-1]][node.data("id")][self.comparisons.selected[cindex-1] + type] === void(0)) ? .4 : 1;
        }

        self.toggleSelectors = function(on) {
            var i,
            inps = self.assElements.comp.selectors;
            for (i = 0; i < inps.length; i++) {
                inps[i].disabled = !inps[i].checked && !on;  // disable only unchecked inputs
            }
        }

        self.compClicker = function() {
            var dataset = this.attributes.group.value,  // this references the checkbox that is changed
                comp = this.id.split("_").slice(1).join("_"),  // id begins with "dsNNN_", so slice and recover second part
                imgs = self.assElements.comp.pieImgs,  // self references the NetworkObject
                c = self.comparisons,
                i;

            // remove pie icons from all comparisons
            for (i = 0; i < imgs.length; i++) {
                imgs[i].src = "";
                imgs[i].style.display = "none";
            }

            // check how many checkboxes are checked and refuse to add more if the limit is reached
            if (this.checked) {
                if (c.selected.length == c.maxSelectable - 1) {  // This click pushes us to the max...
                    self.toggleSelectors(false);  // ...so disable the unchecked inputs.
                } else if (c.selected.length >= c.maxSelectable) {  // This should never be called but is a fallback just in case.
                    alert("Cannot select more than 4 comparisons!");
                    this.checked = false;  // Do not use the .click() method here because it fires the .onchange event, producing an infinite loop!
                    return;
                }
                c.selected.push(comp);  // add the comparison to the array of checked comparisons
                c.selectedDatasets.push(dataset);  // add the dataset to the array of corresponding datasets

                // retrieve the file for this dataset
                self.data._requests.push(dataset);
                self.assElements.comp.unselectall.show();  // show button
            } else {
                if (c.selected.length == c.maxSelectable) {  // This click lowers the number below the max...
                    self.toggleSelectors(true);  // ...so enable all boxes again.
                } else if (c.selected.length == 1) {
                    self.assElements.comp.unselectall.hide();  // hide button
                }
                i = c.selected.indexOf(comp);
                c.selected.splice(i, 1);  // remove the comparison from the array of checked comparisons
                c.selectedDatasets.splice(i, 1);  // remove the dataset from the array of corresponding datasets
            }
            if (!self.data._check) {
                self.data._check = setInterval(self.data._fetch, 100);
            }
            if (!self.triggered) {
                self.triggered = setInterval(self.checkTrigger, 100);  // trigger min/max recalculation and display update
            }
        }

        self.checkTrigger = function() {
            if (self.data._requests.length === 0) {  // check request Array - if it reaches length 0, all requests have been served
                clearInterval(self.triggered);  // stop regular check
                self.triggered = null;  // undefine interval handle
                self.legend.updateColorStripe();
                self.updateNodeColors();  // proceed with coloring
            }
        }

        self.updateNodeColors = function() {
            busify("updatenodecolors", function() {
                var s = self.comparisons.selected,
                    l = s.length,
                    index = self.index + 1,
                    i, ele;

                self.chameleons.nodes.removeClass("expr pie1 pie2 pie3 pie4");

                // add pie icons to the selected comparisons
                if (l > 0) {
                    for (i = 0; i < l; i++) {
                        ele = $("#ds" + index + "_" + s[i])[0].previousSibling;
                        ele.src = "img/pie" + l + "-" + (i+1) + ".svg";
                        ele.style.display = "inline";
                    }
                }

                // for all views
                if (l > 0) {
                    self.chameleons.nodes.addClass("expr pie" + l);
                    self.flats.nodes.addClass("flat");
                    self.assElements.legend.class.style.display = "none";
                    self.assElements.legend.stripe.classList.remove("stashed-away");
                } else {
                    self.flats.nodes.removeClass("flat");
                    self.assElements.legend.class.style.display = "block";
                    self.assElements.legend.stripe.classList.add("stashed-away");
                }
            });
        }

        // onclick attribute of the qtip buttons
        self.toggleNodeMark = function(evt) {
            /* We have to check the context of the event because the user can mark the element either via a button or via a select element.
             * Depending on that, different things need to be done. */
            var ele = evt.target,
                n;
            if (ele.tagName == "BUTTON") {  // get node id from button attribute
                n = self.cjs.getElementById(ele.attributes.node.value);
            } else {  // get node id from evt parameters
                n = self.cjs.getElementById(evt.params.data.id);
            }
            if (self.marked.nodes.intersection(n).length == 0) {  // node was in unmarked state
                self.marked.nodes = self.marked.nodes.add(n);
                if (ele.tagName == "BUTTON") {  // The user marked the node via the button in its Cytoscape.js qtip.
                    var s = $(self.assElements.selects.marked);
                    s.val((s.val() || []).concat(n.data("id"))).trigger("change");
                    ele.textContent = "Unmark this factor";
                    ele.classList.remove("unmarked");
                } else { // The user marked the node via the select element.
                }
                n.addClass("marked");
                if (self.marked.nodes.size() == 1 && self.predefStash == null)  // prevent collision with predefined extraction
                    self.assElements.buttons.extract.on("click", self.extractSubnetwork).removeClass("disabledbuttonlike");
            } else {  // node was in marked state
                self.marked.nodes = self.marked.nodes.subtract(n);
                if (ele.tagName == "BUTTON") {  // The user unmarked the node via the button in its Cytoscape.js qtip.
                    var s = $(self.assElements.selects.marked),
                        a = s.val() || [];
                    a.splice(a.indexOf(n.data("id")), 1);
                    s.val(a).trigger("change");
                    ele.textContent = "Mark this factor";
                    ele.classList.add("unmarked");
                } else { // The user unmarked the node via the select element.
                }
                n.removeClass("marked");
                if (self.marked.nodes.empty())  self.assElements.buttons.extract.off("click", self.extractSubnetwork).addClass("disabledbuttonlike");
            }
        }

        self.extractSubnetwork = function(evt) {
            busify("custom-subnetwork", function() {
                var ass = self.assElements;
                if (self.markedStash === null) {  // no stored nodes
                    // "extraction" happens by (temporarily) removing the node complement from the graph
                    if (ass.extractneighbors.checked) {
                        self.markedStash = self.marked.nodes.closedNeighborhood().absoluteComplement().remove();
                    } else {
                        self.markedStash = self.marked.nodes.absoluteComplement().remove();
                    }
                    ass.buttons.extract.text("Restore");
                } else {  // stored nodes
                    // readd removed nodes to the graph
                    self.markedStash.restore();
                    self.markedStash = null;
                    ass.buttons.extract.text("Extract");
                }
                // If nodes were stashed, prevent subgraph extraction as well as changing the selection of marked nodes.
                ass.selects.subgraphs[0].disabled
                    = ass.selects.marked.disabled
                    = ass.extractneighbors.disabled
                    = self.markedStash != null;
                // delete highlighting
                self.cjs.nodes().removeClass("halo");
                ass.selects.highlight.val(null).trigger("change");
            });
        }

        self.readLocalFiles = function() {

            // local subfunction
            function parseInputResults(res, f) {
                var comps, c, l, ids, i, j, k, mappedsymbol,
                    cu = self.data.custom,
                    range = [cu.globals.min_logFC, cu.globals.max_logFC],
                    newComps = new Set(), validComps = [];

                if (res.errors.length > 0) {
                    alert(f.name + "\n\n"
                            + "This file does not have the expected format.\n"
                            + "Please check the format specification in the help carefully. Common errors include:\n"
                            + "- selecting a spreadsheet format (Excel, LibreOffice) instead of a CSV file\n"
                            + "- empty lines, e.g. at the end of the file"
                    );
                    return;
                } else if (res.data.length == 0) {
                    alert("This file does not contain valid content: " + f.name);
                    return;
                }

                // make sure we do not add a comparison with a name that is already taken
                comps = Object.keys(res.data[0]);
                comps.splice(comps.indexOf("Symbol"), 1);
                comps.forEach(function(c) {
                    // select next free id for uploaded identifiers
                    var newid = "custom" + (++cu.globals.counter);
                    while (cu.globals.comparisons.indexOf(newid) > -1) {
                        newid = "custom" + (++cu.globals.counter);
                    }
                    validComps.push({"label": c, "id": newid});
                });
                if (validComps.length > 0) {
                    // put data from csv into container for custom dataset
                    for (i = 0; i < res.data.length; i++) {
                        l = res.data[i];  // substitute value for index
                        mappedsymbol = l.Symbol[0].toUpperCase() + l.Symbol.substr(1).toLowerCase();
                        ids = self.mappers.symbol[mappedsymbol];
                        if (ids === void(0) || ids.length == 0)  continue;  // next if no nodes for this symbol
                        for (j = 0; j < validComps.length; j++) {
                            c = validComps[j];  // substitute value for index
                            if (typeof l[c.label] == "number") {
                                newComps.add(c);  // add the comparison if we find at least one valid value in the input
                                range.push(l[c.label]);
                                for (k = 0; k < ids.length; k++)
                                    cu[ids[k]][c.id + "_logFC"] = l[c.label];
                            }
                        }
                    }
                    if (newComps.size > 0) {
                        // recalculate global min/max for the custom set, and flag it as changed
                        cu.globals.min_logFC = Math.min.apply(null, range);
                        cu.globals.max_logFC = Math.max.apply(null, range);
                        cu.globals.changed = true;
                        // store observed comparisons
                        newComps.forEach(function(c) {
                            if (cu.globals.comparisons.indexOf(c.id) == -1)
                                cu.globals.comparisons.push(c.id);
                        });
                        if (self.comparisons.selectedDatasets.indexOf("custom") > -1)
                            self.legend.updateColorStripe(true);  // force color stripe update
                    }
                }
                if (newComps.size == 0) {
                    alert(f.name + "\n\n"
                            + "This file's content has NOT been added for one of the following reasons:\n"
                            + "- The file is empty.\n"
                            + "- None of the genes in the file matches any of those in the platform.\n"
                    );
                }
                return newComps;
            }

            // local subfunction
            function addMenuEntries(entries) {
                if (entries.size > 0) {
                    var index = self.index + 1,
                        culi = self.assElements.comp.culi,
                        cula = self.assElements.comp.cula[0],
                        liTemplate = culi.firstElementChild;  // should always be the hidden template <li>
                    entries.forEach(function(e) {
                        var l = liTemplate.cloneNode(true),  // clone the <li> element and its descendants
                            // hierarchy is: <li><span><img/><input/></span></li>
                            s = l.children[0],  // extract <span> element by taking advantage of the fixed hierarchy
                            i = s.children[1];  // extract <input> element by taking advantage of the fixed hierarchy
                        s.appendChild(document.createTextNode(e.label));  // add label as inner text to span
                        i.id = "ds" + index + "_" + e.id;  // make dataset label available as <input> id
                        i.addEventListener("change", self.compClicker);  // register onchange event
                        l.attributes.removeNamedItem("style");  // get rid of invisibility
                        culi.appendChild(l);  // append cloned <li> node to the list
                        self.assElements.comp.selectors.push(i);  // update <input> element list
                        self.assElements.comp.pieImgs.push(s.children[0]);  // update <img> element list
                    });
                    culi.style.display = "block";  // remove the <ul> element's invisibility
                    cula.classList.add("dataset");  // add necessary behavior
                }
            }

            // proper code of the function begins here
            self.assElements.comp.fileinput.parse({
                config: {
                    header: true,  // we insist on a defined header
                    worker: true,  // use a worker for parsing
                    dynamicTyping: true,  // convert numbers and boolean values to their respective types
                    comments: "#",  // obey standard comment character
                    complete: function(results, file) {  // called every time parsing of one file is completed
                        // add PapaParse result to data property
                        var newComps = parseInputResults(results, file);
                        // add menu entries for the new comparisons
                        if (newComps)  addMenuEntries(newComps);
                        /*var oComps = {};
                        newComps.forEach(function(e) {
                            oComps[e] = e;
                        });
                        self.addComparisonsToMenu("custom", oComps);*/
                    }
                },
                complete: function() {  // called once all files have been parsed
                }
            });
        }

        // copied mostly verbatim from https://stackoverflow.com/questions/39168928/cytoscape-save-graph-as-image-by-button/39173400#39173400
        self.saveViewAsImage = function() {
            var b64key = 'base64,',
                content = self.cjs.png(),
                b64 = content.substring(content.indexOf(b64key) + b64key.length);
            saveAs(base64toBlob(b64, "image/png"), "test.png");
        }
    },
    gColorUndefined = '#00CCCC'
;


//////// start main part
$.ready = function() {
    let submitBlockedLabel = "Please type your message in the right-hand text field."
    $('#tab1')[0].checked = true;  // force first network to be selected
    $('#form-email').on("input", function() {  // oninput fires on keystrokes, pasting, etc - onchange fires only once the element loses focus
        let empty = this.value == "";
        $('#form-confirm')  // change status based on text in e-mail input field
            .prop("checked", !empty)
            .prop("disabled", empty);
        $('#form-confirm, #form-confirm + label')
            .toggleClass("blocked", this.value == "");
    }).trigger("input");  // the trigger sets the correct state when the page is soft-refreshed in Firefox
    $('#form-message').on("input", function() {
        let empty = this.value == "";
        $('#form-submit')
            .prop("disabled", empty)
            .toggleClass("blocked", empty)
            .val(empty ? submitBlockedLabel : "Submit");
    }).trigger("input");
    $('#contact form').on("submit", function() {
        let data = {
                name: this.querySelector("#form-name").value,
                email: this.querySelector("#form-email").value,
                replyto: this.querySelector("#form-replyto").value,
                confirm: this.querySelector("#form-confirm").checked,
                message: this.querySelector("#form-message").value
            };
        $.post("cgi/contact.cgi", data)
            .fail(function(o, t, e) {  // o = jqXHR object, t = ?, e = error object
                alert("We are sorry but the message could not be sent. Please try again later.");
                //console.log("failed\n", t, e, o);
            }).done(function(d, t, o) {  // expected: d = response sent by script; t = "success"; o = jqXHR object
                $('#form-message').val(null).trigger("input");
                alert("Message sent.");
                //console.log("done\n", d, t, o);
            });
        return false;  // prevent page redirect after clicking the submit button
    });
    let o = $('#networkoccluder')[0];
    o.innerHTML = "<div class='loadinganimation'></div>";  // replace "JavaScript required" message with loading animation
    o.style.cursor = "wait";

    $('#pagenav > div').hover(function() { // mouseenter
        $('#pagenav > p').hide();
        $('#pagenav > :nth-child(2)').show();
        $('#pagenav > :first-child span').removeClass("hidden");
    }, function() {  // mouseleave
        $('#pagenav > p').show();
        $('#pagenav > :nth-child(2)').hide();
        $('#pagenav > :first-child span').addClass("hidden");
    });

    $('#pagenav p.showtips').on("click", function() {
        $('.instructions').removeClass("hidden");  // Shows the 'span.instructions', not the 'div.instructionbox'!
    });
    $('#pagenav p.showhelp').on("click", function() {
        $(document.body).addClass("noscroll");
        $('#instructionblocker').removeClass("hidden");
    });
    $('.instructionbox p :first-child').on("click", function(evt) {
        $(evt.target.parentElement.parentElement).addClass("hidden");  // Hides the 'span.instructions', not the 'div.instructionbox'!
    });
    $('.instructionbox p :last-child').on("click", function() {
        $('.instructions').addClass("hidden");  // Hides the 'span.instructions', not the 'div.instructionbox'!
    });
    $('.instructions a').on("click", function(evt) {
        $(document.body).addClass("noscroll");
        $('#instructionblocker').removeClass("hidden");
        let ele = $('#inst-' + evt.target.innerText.split(" ").slice(-1)[0]);
        $('#instructiondetails > :first-child').animate({
            scrollTop: ele[0].offsetTop  // Make sure `ele`'s direct parent element has its position attribute set to at least "relative"!
        }, 500);
    });
    $('#instructionblocker').on("click", function(evt) {
        /* No other way but the if-clause below was apparent to restrict the event to the button and #instructionblocker's box shadow. */
        if (evt.target.isSameNode($('#instructionblocker')[0]) || evt.target.isSameNode($('#instructiondetails > .buttonlike')[0])) {
            $('#instructionblocker').addClass("hidden");
            $(document.body).removeClass("noscroll");
        }
    });

    setTimeout(loadFirstNetwork, 50);  // necessary to allow display update resulting from the above instruction
}
//////// end main part


function loadFirstNetwork() {
    $('#network-nav input[type=radio]').on("click", function(evt) {
        var index = evt.target.id.slice(3),  // extract number
            resize = false;

        if (gCy.length > 0 && gCurNet === gCy[index-1])  return;
        while (gCy.length < index)  gCy.push(null);  // necessary e.g. if we load network 4 before 2 and 3
        if (gCy[index-1] === null) {
            $('.occluder').removeClass("hidden");
            gCurNet = gCy[index-1] = new gNetworkObjectTemplate(index-1, evt.target.attributes.prefix.value);
            gCurNet.createInstance(null, { name: "preset" }, function() {
                $('.occluder').addClass("hidden");
            });
        } else {
            gCurNet = gCy[index-1];
            resize = true;  // schedule display update for later
        }
        $('#menus .simplewrapper').hide();  // hide all
        $('#simplewrapper_' + index).show();  // show the selected one
        if (resize)  gCurNet.cjs.resize();
    });

    var i,
        gNetworkNumber = 1;
    for (i = 0; i < gNetworkNumber; i++) {
        gCy.push(new gNetworkObjectTemplate());  // add one array element for all pre-defined networks
    }
    gCurNet = gCy[0];
    gCurNet.prefix = $('#network-nav input[type=radio]')[1].attributes.prefix.value;  // read from second entry, first one is dummy
    gCurNet.createInstance(null, { name: "preset" }, function() {
        $(".select2-selection__rendered").attr("title", "");  // see https://github.com/select2/select2/issues/3158
        $('.occluder').addClass("hidden");
    });
}


function createDisplay(network, elements, container, layout, callback) {
	cytoscape({
		// very commonly used options:
		container: container,
		elements: elements,
		style: cytoscape.stylesheet( )
			.selector('node')
				.css({
                    'content': 'data(tag)',
                    'min-zoomed-font-size': 6,
                    'background-color': 'data(clcolor)',
                    'shape': 'data(clshape)',
                    'line-color': '#091f37',
                    'height': function(d) {  return d.data("nodeSize") || 30  },
                    'width': function(d) {  return d.data("nodeSize") || 30  },
				})
			.selector('edge')
				.css({
					//'content': 'data(r_id)',
					'width': 4,
					'opacity': .4,
					'line-color': 'data(tycolor)',
					'mid-target-arrow-color': 'data(tycolor)',
					'mid-target-arrow-shape': 'triangle',
				})
            .selector('.pie1')
                .css({  // only set pie piece sizes here, everything else is set in '.expr' below
                    'pie-1-background-size': 100 / 1,
                    'pie-2-background-size': 0,
                    'pie-3-background-size': 0,
                    'pie-4-background-size': 0,
                })
            .selector('.pie2')
                .css({  // only set pie piece sizes here, everything else is set in '.expr' below
                    'pie-1-background-size': 100 / 2,
                    'pie-2-background-size': 100 / 2,
                    'pie-3-background-size': 0,
                    'pie-4-background-size': 0,
                })
            .selector('.pie3')
                .css({  // only set pie piece sizes here, everything else is set in '.expr' below
                    'pie-1-background-size': 100 / 3,
                    'pie-2-background-size': 100 / 3,
                    'pie-3-background-size': 100 / 3,
                    'pie-4-background-size': 0,
                })
            .selector('.pie4')
                .css({  // only set pie piece sizes here, everything else is set in '.expr' below
                    'pie-1-background-size': 100 / 4,
                    'pie-2-background-size': 100 / 4,
                    'pie-3-background-size': 100 / 4,
                    'pie-4-background-size': 100 / 4,
                })
            .selector('.expr')
                .css({  // all datasets get additional properties
                    'shape': 'ellipse',
                    'background-color': '#fff',
                    'border-color': '#909090',
                    'border-width': 2,
                    'height': 50,
                    'width': 50,
                    'pie-1-background-opacity': function(d) { return network.nodeOpacity(d, 1) },
                    'pie-2-background-opacity': function(d) { return network.nodeOpacity(d, 2) },
                    'pie-3-background-opacity': function(d) { return network.nodeOpacity(d, 3) },
                    'pie-4-background-opacity': function(d) { return network.nodeOpacity(d, 4) },
                    'pie-1-background-color': function(d) { return network.nodeColor(d, 1) },
                    'pie-2-background-color': function(d) { return network.nodeColor(d, 2) },
                    'pie-3-background-color': function(d) { return network.nodeColor(d, 3) },
                    'pie-4-background-color': function(d) { return network.nodeColor(d, 4) },
                })
            .selector('.flat')
                .css({
                    'background-color': gColorUndefined,
                    'background-opacity': .4,
                    'opacity': .4,
                })
            .selector('.halo')
                .css({
                    'border-color': 'gold',
                    'border-width': 10,
                })
            .selector(':selected, .marked')
                .css({
                    'font-weight': 'bold',
                    'border-color': '#091f37',
                    'border-width': 2,
                    'opacity': 1
                })
            .selector('.marked')
                .css({
                    'border-width': 4,
                }),
		layout: layout,
		//layoutready: cyPostProcess,  // related to the break of function that occurs between 2.5.0 and 2.5.1
		ready: function() { callback(this) },

		// initial viewport state:
		zoom: 1,
		pan: { x: 0, y: 0 },

		// interaction options:
		minZoom: 5e-2,
		maxZoom: 5e0,
		zoomingEnabled: true,
		userZoomingEnabled: true,
		panningEnabled: true,
		userPanningEnabled: true,
		boxSelectionEnabled: false,
		//selectionType: (isTouchDevice ? 'additive' : 'single'),
		touchTapThreshold: 8,
		desktopTapThreshold: 4,
		autolock: false,
		autoungrabify: false,
		autounselectify: false,

		// rendering options:
		headless: false,
		styleEnabled: true,
		hideEdgesOnViewport: false,
		hideLabelsOnViewport: true,
		textureOnViewport: false,
		motionBlur: false,
		wheelSensitivity: .2,  // determines zoom "speed"
		pixelRatio: 1,
		initrender: function(evt){ /* ... */ },
		renderer: { /* ... */ }
	});
}


// converter needed for saving images
// copied from https://stackoverflow.com/a/34354313
function base64toBlob(base64Data, contentType, sliceSize) {
    var byteCharacters,
        byteArray,
        byteNumbers,
        blobData,
        blob;

    contentType = contentType || '';
    byteCharacters = atob(base64Data);
    // Get blob data sliced or not
    blobData = sliceSize ? getBlobDataSliced() : getBlobDataAtOnce();
    blob = new Blob(blobData, { type: contentType });
    return blob;


    /*
     * Get blob data in one slice.
     * => Fast in IE on new Blob(...)
     */
    function getBlobDataAtOnce() {
        byteNumbers = new Array(byteCharacters.length);

        for (var i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        byteArray = new Uint8Array(byteNumbers);

        return [byteArray];
    }

    /*
     * Get blob data in multiple slices.
     * => Slow in IE on new Blob(...)
     */
    function getBlobDataSliced() {

        var slice,
            byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            slice = byteCharacters.slice(offset, offset + sliceSize);

            byteNumbers = new Array(slice.length);

            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            byteArray = new Uint8Array(byteNumbers);

            // Add slice
            byteArrays.push(byteArray);
        }

        return byteArrays;
    }
}

