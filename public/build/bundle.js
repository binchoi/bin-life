
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function save(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch(e) {
        alert('Error saving to localStorage: ' + e);
      }
    }

    function load(key) {
      try {
        const encoded = localStorage.getItem(key);

        if(!encoded) {
          return null;
        }

        return JSON.parse(encoded);
      } catch(e) {
        alert('Error loading from localStorage: ' + e);
      }
    }

    const today = stringify(new Date());

    function clone(date) {
      return new Date(date.getTime());
    }

    function stringify(date) {
      return date.toISOString().substr(0, 10);
    }

    function add(date, amount, unit) {
      let functionName;

      switch(unit) {
        case 'days':
          functionName = 'Date';
          break;
        case 'years':
          functionName = 'FullYear';
          break;
        default:
          throw new Error('Only days and years supported');
      }

      const newDate = clone(date);
      newDate['setUTC' + functionName](newDate['getUTC' + functionName]() + amount);
      return newDate;
    }

    function generateYears(dateOfBirth) {
      let yearIterator = clone(dateOfBirth);
      const allYears = [];

      for(let y = 0; y < 100; y++) {
        let startOfYear = yearIterator;
        let endOfYear = add(add(startOfYear, 1, 'years'), -1, 'days');

        let weekIterator = clone(startOfYear);
        const allWeeks = [];

        for(let w = 1; w <= 52; w++) {
          let startOfWeek = weekIterator;

          weekIterator = add(weekIterator, 6, 'days');
          let endOfWeek = weekIterator;

          while(w === 52 && stringify(endOfWeek) < stringify(endOfYear)) {
            weekIterator = add(weekIterator, 1, 'days');
            endOfWeek = weekIterator;
          }

          allWeeks.push({
            weekNumber: w,
            age: y,
            startDate: stringify(startOfWeek),
            endDate: stringify(endOfWeek),
            matchedTimeSpans: [],
          });

          weekIterator = add(weekIterator, 1, 'days');
        }

        allYears.push({
          year: yearIterator.getFullYear(),
          age: y,
          startDate: stringify(startOfYear),
          endDate: stringify(endOfYear),
          weeks: allWeeks,
        });

        yearIterator = add(yearIterator, 1, 'years');
      }

      return allYears;
    }

    const appMode = writable('default');
    const showSettings = writable(false);
    const currentWeek = writable(null);
    const clickedWeek = writable(null);
    const dobString = writable(load('dateOfBirth') || "2001-02-19");
    const timeSpans = writable(load('timeSpans') || []);
    const editIdx = writable(null);

    const categories = derived(timeSpans, $timeSpans => {
      const categories = [];

      for(let timeSpan of $timeSpans) {
        if(!categories.includes(timeSpan.category)) {
          categories.push(timeSpan.category);
        }
      }

      if(!categories.length) {
        categories.push('Default');
      }

      return [...new Set(categories)];
    });

    const settings = writable(load('settings') || {
      showPast: true,
      blinkNow: true,
    });

    const newTimeSpan = writable({
      startDate: null,
      endDate: null,
      name: '',
      description: '',
      category: '',
      style: {},
    });

    /* src/AgeCalculator.svelte generated by Svelte v3.38.2 */
    const file$b = "src/AgeCalculator.svelte";

    function create_fragment$c(ctx) {
    	let div;
    	let t0;
    	let b;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("You have spent ");
    			b = element("b");
    			b.textContent = `${/*cur_age*/ ctx[0]}`;
    			t2 = text(" on this beautiful planet.");
    			attr_dev(b, "class", "my-age svelte-1dgas68");
    			add_location(b, file$b, 34, 17, 1138);
    			attr_dev(div, "class", "age-calculator");
    			set_style(div, "padding-top", "-1rem");
    			set_style(div, "padding-bottom", "1rem");
    			add_location(div, file$b, 33, 0, 1043);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, b);
    			append_dev(div, t2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function dateDiff(startingDate, endingDate) {
    	let startDate = new Date(new Date(startingDate).toISOString().substr(0, 10));

    	if (!endingDate) {
    		endingDate = new Date().toISOString().substr(0, 10); // need date in YYYY-MM-DD format
    	}

    	let endDate = new Date(endingDate);

    	if (startDate > endDate) {
    		const swap = startDate;
    		startDate = endDate;
    		endDate = swap;
    	}

    	const startYear = startDate.getFullYear();
    	let yearDiff = endDate.getFullYear() - startYear;
    	let monthDiff = endDate.getMonth() - startDate.getMonth();

    	if (monthDiff < 0) {
    		yearDiff--;
    		monthDiff += 12;
    	}

    	return yearDiff + "Y " + monthDiff + "M";
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $dobString;
    	validate_store(dobString, "dobString");
    	component_subscribe($$self, dobString, $$value => $$invalidate(1, $dobString = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("AgeCalculator", slots, []);
    	const today = new Date();
    	const dob = new Date($dobString);
    	const cur_age = dateDiff(today, dob);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AgeCalculator> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		dobString,
    		dateDiff,
    		today,
    		dob,
    		cur_age,
    		$dobString
    	});

    	return [cur_age];
    }

    class AgeCalculator extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AgeCalculator",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/DatePicker.svelte generated by Svelte v3.38.2 */

    const file$a = "src/DatePicker.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (23:2) {#each [...Array(100).keys()].map(y => (startYear + y).toString()) as year}
    function create_each_block_2$1(ctx) {
    	let option;
    	let t_value = /*year*/ ctx[1] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*year*/ ctx[1];
    			option.value = option.__value;
    			add_location(option, file$a, 23, 0, 481);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*startYear*/ 1 && t_value !== (t_value = /*year*/ ctx[1] + "")) set_data_dev(t, t_value);

    			if (dirty & /*startYear*/ 1 && option_value_value !== (option_value_value = /*year*/ ctx[1])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(23:2) {#each [...Array(100).keys()].map(y => (startYear + y).toString()) as year}",
    		ctx
    	});

    	return block;
    }

    // (29:2) {#each [...Array(12).keys()].map(m => (m + 1).toString().padStart(2, '0')) as month}
    function create_each_block_1$1(ctx) {
    	let option;
    	let t_value = /*month*/ ctx[2] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*month*/ ctx[2];
    			option.value = option.__value;
    			add_location(option, file$a, 29, 4, 646);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(29:2) {#each [...Array(12).keys()].map(m => (m + 1).toString().padStart(2, '0')) as month}",
    		ctx
    	});

    	return block;
    }

    // (35:2) {#each [...Array(31).keys()].map(d => (d + 1).toString().padStart(2, '0')) as day}
    function create_each_block$5(ctx) {
    	let option;
    	let t_value = /*day*/ ctx[3] + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*day*/ ctx[3];
    			option.value = option.__value;
    			add_location(option, file$a, 35, 4, 808);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(35:2) {#each [...Array(31).keys()].map(d => (d + 1).toString().padStart(2, '0')) as day}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let select0;
    	let t0;
    	let select1;
    	let t1;
    	let select2;
    	let mounted;
    	let dispose;
    	let each_value_2 = [...Array(100).keys()].map(/*func*/ ctx[5]);
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	let each_value_1 = [...Array(12).keys()].map(func_1);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = [...Array(31).keys()].map(func_2);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = text("\n-\n");
    			select1 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = text("\n-\n");
    			select2 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (/*year*/ ctx[1] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[6].call(select0));
    			add_location(select0, file$a, 21, 0, 376);
    			if (/*month*/ ctx[2] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[7].call(select1));
    			add_location(select1, file$a, 27, 0, 527);
    			if (/*day*/ ctx[3] === void 0) add_render_callback(() => /*select2_change_handler*/ ctx[8].call(select2));
    			add_location(select2, file$a, 33, 0, 693);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select0, anchor);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(select0, null);
    			}

    			select_option(select0, /*year*/ ctx[1]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, select1, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select1, null);
    			}

    			select_option(select1, /*month*/ ctx[2]);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, select2, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select2, null);
    			}

    			select_option(select2, /*day*/ ctx[3]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[6]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[7]),
    					listen_dev(select2, "change", /*select2_change_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Array, startYear*/ 1) {
    				each_value_2 = [...Array(100).keys()].map(/*func*/ ctx[5]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2$1(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*year, Array, startYear*/ 3) {
    				select_option(select0, /*year*/ ctx[1]);
    			}

    			if (dirty & /*Array*/ 0) {
    				each_value_1 = [...Array(12).keys()].map(func_1);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*month, Array*/ 4) {
    				select_option(select1, /*month*/ ctx[2]);
    			}

    			if (dirty & /*Array*/ 0) {
    				each_value = [...Array(31).keys()].map(func_2);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*day, Array*/ 8) {
    				select_option(select2, /*day*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select0);
    			destroy_each(each_blocks_2, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(select1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(select2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func_1 = m => (m + 1).toString().padStart(2, "0");
    const func_2 = d => (d + 1).toString().padStart(2, "0");

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DatePicker", slots, []);
    	let { dateString } = $$props;
    	let { startYear } = $$props;

    	// Hardcode my DOB
    	let year = "2001";

    	let month = "02";
    	let day = "19";
    	const writable_props = ["dateString", "startYear"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DatePicker> was created with unknown prop '${key}'`);
    	});

    	const func = y => (startYear + y).toString();

    	function select0_change_handler() {
    		year = select_value(this);
    		$$invalidate(1, year);
    		$$invalidate(0, startYear);
    	}

    	function select1_change_handler() {
    		month = select_value(this);
    		$$invalidate(2, month);
    	}

    	function select2_change_handler() {
    		day = select_value(this);
    		((($$invalidate(3, day), $$invalidate(1, year)), $$invalidate(2, month)), $$invalidate(4, dateString));
    	}

    	$$self.$$set = $$props => {
    		if ("dateString" in $$props) $$invalidate(4, dateString = $$props.dateString);
    		if ("startYear" in $$props) $$invalidate(0, startYear = $$props.startYear);
    	};

    	$$self.$capture_state = () => ({ dateString, startYear, year, month, day });

    	$$self.$inject_state = $$props => {
    		if ("dateString" in $$props) $$invalidate(4, dateString = $$props.dateString);
    		if ("startYear" in $$props) $$invalidate(0, startYear = $$props.startYear);
    		if ("year" in $$props) $$invalidate(1, year = $$props.year);
    		if ("month" in $$props) $$invalidate(2, month = $$props.month);
    		if ("day" in $$props) $$invalidate(3, day = $$props.day);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*year, month, day, dateString*/ 30) {
    			{
    				$$invalidate(4, dateString = `${year}-${month}-${day}`);

    				// Check for valid date
    				const date = new Date(dateString);

    				if (isNaN(date.getTime())) {
    					$$invalidate(3, day = "28");
    					$$invalidate(4, dateString = `${year}-${month}-${day}`);
    				}
    			}
    		}
    	};

    	return [
    		startYear,
    		year,
    		month,
    		day,
    		dateString,
    		func,
    		select0_change_handler,
    		select1_change_handler,
    		select2_change_handler
    	];
    }

    class DatePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { dateString: 4, startYear: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DatePicker",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dateString*/ ctx[4] === undefined && !("dateString" in props)) {
    			console.warn("<DatePicker> was created without expected prop 'dateString'");
    		}

    		if (/*startYear*/ ctx[0] === undefined && !("startYear" in props)) {
    			console.warn("<DatePicker> was created without expected prop 'startYear'");
    		}
    	}

    	get dateString() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dateString(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startYear() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startYear(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/DobPicker.svelte generated by Svelte v3.38.2 */
    const file$9 = "src/DobPicker.svelte";

    function create_fragment$a(ctx) {
    	let div;
    	let t;
    	let datepicker;
    	let updating_dateString;
    	let current;

    	function datepicker_dateString_binding(value) {
    		/*datepicker_dateString_binding*/ ctx[2](value);
    	}

    	let datepicker_props = { startYear: /*startYear*/ ctx[1] };

    	if (/*$dobString*/ ctx[0] !== void 0) {
    		datepicker_props.dateString = /*$dobString*/ ctx[0];
    	}

    	datepicker = new DatePicker({ props: datepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(datepicker, "dateString", datepicker_dateString_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("Date of Birth: ");
    			create_component(datepicker.$$.fragment);
    			attr_dev(div, "class", "dob-picker");
    			add_location(div, file$9, 13, 0, 295);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			mount_component(datepicker, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const datepicker_changes = {};

    			if (!updating_dateString && dirty & /*$dobString*/ 1) {
    				updating_dateString = true;
    				datepicker_changes.dateString = /*$dobString*/ ctx[0];
    				add_flush_callback(() => updating_dateString = false);
    			}

    			datepicker.$set(datepicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(datepicker);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $dobString;
    	validate_store(dobString, "dobString");
    	component_subscribe($$self, dobString, $$value => $$invalidate(0, $dobString = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DobPicker", slots, []);
    	let startYear = add(new Date(), -99, "years").getFullYear();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DobPicker> was created with unknown prop '${key}'`);
    	});

    	function datepicker_dateString_binding(value) {
    		$dobString = value;
    		dobString.set($dobString);
    	}

    	$$self.$capture_state = () => ({
    		dobString,
    		add,
    		save,
    		DatePicker,
    		startYear,
    		$dobString
    	});

    	$$self.$inject_state = $$props => {
    		if ("startYear" in $$props) $$invalidate(1, startYear = $$props.startYear);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$dobString*/ 1) {
    			{
    				save("dateOfBirth", $dobString);
    			}
    		}
    	};

    	return [$dobString, startYear, datepicker_dateString_binding];
    }

    class DobPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DobPicker",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    function isMarked(appMode, newTimeSpan, currentWeek, week) {

      // Mark only once the start date was clicked.
      if(appMode !== 'create-time-span' || !newTimeSpan.startDate) {
        return false;
      }

      let endDateCondition;

      // Mark all hovered until end date is clicked
      if(!newTimeSpan.endDate) {
        endDateCondition = currentWeek && week.startDate <= currentWeek.endDate;
      } else {
        endDateCondition = week.startDate <= (newTimeSpan.endDate === 'ongoing' ? today : newTimeSpan.endDate);
      }

      return endDateCondition && week.endDate >= newTimeSpan.startDate;
    }

    function isDisabled(appMode, newTimeSpan, week) {
      if(appMode !== 'create-time-span' || !newTimeSpan.startDate || newTimeSpan.endDate) {
        return false;
      }

      return week.endDate < newTimeSpan.startDate;
    }

    function makeStyleString(styleMap) {
      let style = '';

      for(let key in styleMap) {
        let unit = '';

        if(['border-width'].includes(key)) {
          unit = 'px';
        }

        style += styleMap[key] !== null ? `${key}:${styleMap[key]}${unit};` : '';
      }

      return style;
    }

    function assembleStylesMap(week, newStylesMap = null) {
      const stylesMap = {
        'background-color': null,
        'border-color': null,
        'border-width': null,
      };

      for(let span of week.matchedTimeSpans) {
        for(let key in stylesMap) {
          if(span.style[key] !== null) {
            stylesMap[key] = span.style[key];
          }
        }
      }

      if(newStylesMap) {
        for(let key in newStylesMap) {
          if(newStylesMap[key] !== null) {
            stylesMap[key] = newStylesMap[key];
          }
        }
      }

      return stylesMap;
    }

    /* src/SpanDetail.svelte generated by Svelte v3.38.2 */
    const file$8 = "src/SpanDetail.svelte";

    // (15:4) {#if timeSpan.description}
    function create_if_block$5(ctx) {
    	let div;
    	let t_value = /*timeSpan*/ ctx[0].description + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "description svelte-1256lz3");
    			add_location(div, file$8, 15, 6, 403);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*timeSpan*/ 1 && t_value !== (t_value = /*timeSpan*/ ctx[0].description + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(15:4) {#if timeSpan.description}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div4;
    	let div1;
    	let div0;
    	let div0_style_value;
    	let t0;
    	let div3;
    	let div2;
    	let t1_value = /*timeSpan*/ ctx[0].category + "";
    	let t1;
    	let t2;
    	let strong;
    	let t3_value = /*timeSpan*/ ctx[0].name + "";
    	let t3;
    	let br;
    	let t4;
    	let t5_value = /*timeSpan*/ ctx[0].startDate + "";
    	let t5;
    	let t6;
    	let t7_value = /*timeSpan*/ ctx[0].endDate + "";
    	let t7;
    	let t8;
    	let if_block = /*timeSpan*/ ctx[0].description && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			div2 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			strong = element("strong");
    			t3 = text(t3_value);
    			br = element("br");
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = text(" - ");
    			t7 = text(t7_value);
    			t8 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "dot svelte-1256lz3");
    			attr_dev(div0, "style", div0_style_value = makeStyleString(/*timeSpan*/ ctx[0].style));
    			add_location(div0, file$8, 8, 4, 138);
    			attr_dev(div1, "class", "dot-wrapper svelte-1256lz3");
    			add_location(div1, file$8, 7, 2, 108);
    			attr_dev(div2, "class", "category");
    			add_location(div2, file$8, 11, 4, 231);
    			add_location(strong, file$8, 12, 4, 283);
    			add_location(br, file$8, 12, 36, 315);
    			attr_dev(div3, "class", "text");
    			add_location(div3, file$8, 10, 2, 208);
    			attr_dev(div4, "class", "span svelte-1256lz3");
    			add_location(div4, file$8, 6, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, t1);
    			append_dev(div3, t2);
    			append_dev(div3, strong);
    			append_dev(strong, t3);
    			append_dev(div3, br);
    			append_dev(div3, t4);
    			append_dev(div3, t5);
    			append_dev(div3, t6);
    			append_dev(div3, t7);
    			append_dev(div3, t8);
    			if (if_block) if_block.m(div3, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*timeSpan*/ 1 && div0_style_value !== (div0_style_value = makeStyleString(/*timeSpan*/ ctx[0].style))) {
    				attr_dev(div0, "style", div0_style_value);
    			}

    			if (dirty & /*timeSpan*/ 1 && t1_value !== (t1_value = /*timeSpan*/ ctx[0].category + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*timeSpan*/ 1 && t3_value !== (t3_value = /*timeSpan*/ ctx[0].name + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*timeSpan*/ 1 && t5_value !== (t5_value = /*timeSpan*/ ctx[0].startDate + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*timeSpan*/ 1 && t7_value !== (t7_value = /*timeSpan*/ ctx[0].endDate + "")) set_data_dev(t7, t7_value);

    			if (/*timeSpan*/ ctx[0].description) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("SpanDetail", slots, []);
    	let { timeSpan } = $$props;
    	const writable_props = ["timeSpan"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SpanDetail> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("timeSpan" in $$props) $$invalidate(0, timeSpan = $$props.timeSpan);
    	};

    	$$self.$capture_state = () => ({ makeStyleString, timeSpan });

    	$$self.$inject_state = $$props => {
    		if ("timeSpan" in $$props) $$invalidate(0, timeSpan = $$props.timeSpan);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [timeSpan];
    }

    class SpanDetail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { timeSpan: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SpanDetail",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*timeSpan*/ ctx[0] === undefined && !("timeSpan" in props)) {
    			console.warn("<SpanDetail> was created without expected prop 'timeSpan'");
    		}
    	}

    	get timeSpan() {
    		throw new Error("<SpanDetail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeSpan(value) {
    		throw new Error("<SpanDetail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/CurrentWeekDetails.svelte generated by Svelte v3.38.2 */
    const file$7 = "src/CurrentWeekDetails.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (6:0) {#if $currentWeek}
    function create_if_block$4(ctx) {
    	let div;
    	let strong;
    	let t0;
    	let t1_value = /*$currentWeek*/ ctx[0].age + "";
    	let t1;
    	let t2;
    	let t3_value = /*$currentWeek*/ ctx[0].weekNumber + "";
    	let t3;
    	let br;
    	let t4;
    	let t5_value = /*$currentWeek*/ ctx[0].startDate + "";
    	let t5;
    	let t6;
    	let t7_value = /*$currentWeek*/ ctx[0].endDate + "";
    	let t7;
    	let t8;
    	let current;
    	let if_block = /*$currentWeek*/ ctx[0].matchedTimeSpans?.length && create_if_block_1$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			strong = element("strong");
    			t0 = text("Age ");
    			t1 = text(t1_value);
    			t2 = text(", Week ");
    			t3 = text(t3_value);
    			br = element("br");
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = text(" - ");
    			t7 = text(t7_value);
    			t8 = space();
    			if (if_block) if_block.c();
    			attr_dev(strong, "class", "week svelte-mswh5d");
    			add_location(strong, file$7, 7, 4, 168);
    			add_location(br, file$7, 7, 88, 252);
    			attr_dev(div, "class", "current-week-details svelte-mswh5d");
    			add_location(div, file$7, 6, 2, 129);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, strong);
    			append_dev(strong, t0);
    			append_dev(strong, t1);
    			append_dev(strong, t2);
    			append_dev(strong, t3);
    			append_dev(div, br);
    			append_dev(div, t4);
    			append_dev(div, t5);
    			append_dev(div, t6);
    			append_dev(div, t7);
    			append_dev(div, t8);
    			if (if_block) if_block.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*$currentWeek*/ 1) && t1_value !== (t1_value = /*$currentWeek*/ ctx[0].age + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*$currentWeek*/ 1) && t3_value !== (t3_value = /*$currentWeek*/ ctx[0].weekNumber + "")) set_data_dev(t3, t3_value);
    			if ((!current || dirty & /*$currentWeek*/ 1) && t5_value !== (t5_value = /*$currentWeek*/ ctx[0].startDate + "")) set_data_dev(t5, t5_value);
    			if ((!current || dirty & /*$currentWeek*/ 1) && t7_value !== (t7_value = /*$currentWeek*/ ctx[0].endDate + "")) set_data_dev(t7, t7_value);

    			if (/*$currentWeek*/ ctx[0].matchedTimeSpans?.length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$currentWeek*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(6:0) {#if $currentWeek}",
    		ctx
    	});

    	return block;
    }

    // (11:4) {#if $currentWeek.matchedTimeSpans?.length}
    function create_if_block_1$4(ctx) {
    	let hr;
    	let t;
    	let each_1_anchor;
    	let current;
    	let each_value = /*$currentWeek*/ ctx[0].matchedTimeSpans;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(hr, "class", "spacer svelte-mswh5d");
    			add_location(hr, file$7, 11, 6, 366);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currentWeek*/ 1) {
    				each_value = /*$currentWeek*/ ctx[0].matchedTimeSpans;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(11:4) {#if $currentWeek.matchedTimeSpans?.length}",
    		ctx
    	});

    	return block;
    }

    // (13:6) {#each $currentWeek.matchedTimeSpans as timeSpan}
    function create_each_block$4(ctx) {
    	let div;
    	let spandetail;
    	let t;
    	let current;

    	spandetail = new SpanDetail({
    			props: { timeSpan: /*timeSpan*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(spandetail.$$.fragment);
    			t = space();
    			attr_dev(div, "class", "detail-wrapper svelte-mswh5d");
    			add_location(div, file$7, 13, 8, 450);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(spandetail, div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const spandetail_changes = {};
    			if (dirty & /*$currentWeek*/ 1) spandetail_changes.timeSpan = /*timeSpan*/ ctx[1];
    			spandetail.$set(spandetail_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spandetail.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spandetail.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(spandetail);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(13:6) {#each $currentWeek.matchedTimeSpans as timeSpan}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$currentWeek*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$currentWeek*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$currentWeek*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$4(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $currentWeek;
    	validate_store(currentWeek, "currentWeek");
    	component_subscribe($$self, currentWeek, $$value => $$invalidate(0, $currentWeek = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CurrentWeekDetails", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CurrentWeekDetails> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ currentWeek, SpanDetail, $currentWeek });
    	return [$currentWeek];
    }

    class CurrentWeekDetails extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CurrentWeekDetails",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    var CloseIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\">\n    <g>\n        <path d=\"M18.717 6.697l-1.414-1.414-5.303 5.303-5.303-5.303-1.414 1.414 5.303 5.303-5.303 5.303 1.414 1.414 5.303-5.303 5.303 5.303 1.414-1.414-5.303-5.303z\"/>\n    </g>\n</svg>";

    /* src/CreateTimeSpan.svelte generated by Svelte v3.38.2 */
    const file$6 = "src/CreateTimeSpan.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    // (90:4) {:else}
    function create_else_block_5(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*$newTimeSpan*/ ctx[5].startDate + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("Start: ");
    			t1 = text(t1_value);
    			attr_dev(div, "class", "substep svelte-1pl6nbx");
    			add_location(div, file$6, 90, 6, 1989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$newTimeSpan*/ 32 && t1_value !== (t1_value = /*$newTimeSpan*/ ctx[5].startDate + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_5.name,
    		type: "else",
    		source: "(90:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (88:4) {#if !$newTimeSpan.startDate}
    function create_if_block_5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Pick a start date from the calendar";
    			attr_dev(div, "class", "substep svelte-1pl6nbx");
    			add_location(div, file$6, 88, 6, 1908);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(88:4) {#if !$newTimeSpan.startDate}",
    		ctx
    	});

    	return block;
    }

    // (100:6) {:else}
    function create_else_block_4$1(ctx) {
    	let t0;
    	let t1_value = /*$newTimeSpan*/ ctx[5].endDate + "";
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = text("End: ");
    			t1 = text(t1_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$newTimeSpan*/ 32 && t1_value !== (t1_value = /*$newTimeSpan*/ ctx[5].endDate + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4$1.name,
    		type: "else",
    		source: "(100:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:6) {#if !$newTimeSpan.endDate}
    function create_if_block_4$1(ctx) {
    	let t0;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text("Pick an end date or click\n        ");
    			button = element("button");
    			button.textContent = "ongoing";
    			attr_dev(button, "class", "ongoing svelte-1pl6nbx");
    			add_location(button, file$6, 98, 8, 2224);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(97:6) {#if !$newTimeSpan.endDate}",
    		ctx
    	});

    	return block;
    }

    // (124:6) {:else}
    function create_else_block_3$1(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "id", "category");
    			attr_dev(input, "class", "svelte-1pl6nbx");
    			add_location(input, file$6, 124, 8, 3238);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$newTimeSpan*/ ctx[5].category);
    			/*input_binding_1*/ ctx[18](input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[17]),
    					listen_dev(input, "blur", /*handleCatBlur*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$newTimeSpan*/ 32 && input.value !== /*$newTimeSpan*/ ctx[5].category) {
    				set_input_value(input, /*$newTimeSpan*/ ctx[5].category);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding_1*/ ctx[18](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3$1.name,
    		type: "else",
    		source: "(124:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (117:6) {#if categoryInputType === 'select'}
    function create_if_block_3$2(ctx) {
    	let select;
    	let option;
    	let mounted;
    	let dispose;
    	let each_value = /*$categories*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option = element("option");
    			option.textContent = "Create new category...";
    			option.__value = "$$createNew";
    			option.value = option.__value;
    			add_location(option, file$6, 121, 10, 3138);
    			attr_dev(select, "id", "category");
    			add_location(select, file$6, 117, 8, 2972);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			append_dev(select, option);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*handleCategoryChange*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$categories*/ 64) {
    				each_value = /*$categories*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, option);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(117:6) {#if categoryInputType === 'select'}",
    		ctx
    	});

    	return block;
    }

    // (119:10) {#each $categories as category}
    function create_each_block$3(ctx) {
    	let option;
    	let t_value = /*category*/ ctx[30] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*category*/ ctx[30];
    			option.value = option.__value;
    			add_location(option, file$6, 119, 12, 3082);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$categories*/ 64 && t_value !== (t_value = /*category*/ ctx[30] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*$categories*/ 64 && option_value_value !== (option_value_value = /*category*/ ctx[30])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(119:10) {#each $categories as category}",
    		ctx
    	});

    	return block;
    }

    // (137:8) {:else}
    function create_else_block_2$1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Set background color";
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-1pl6nbx");
    			add_location(a, file$6, 137, 10, 3836);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*click_handler_3*/ ctx[21]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2$1.name,
    		type: "else",
    		source: "(137:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (131:8) {#if $newTimeSpan.style['background-color'] !== null}
    function create_if_block_2$2(ctx) {
    	let input;
    	let t0;
    	let div;
    	let label;
    	let t2;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			label = element("label");
    			label.textContent = "Background color";
    			t2 = space();
    			a = element("a");
    			a.textContent = "unset";
    			attr_dev(input, "type", "color");
    			attr_dev(input, "id", "bg-color");
    			attr_dev(input, "class", "svelte-1pl6nbx");
    			add_location(input, file$6, 131, 10, 3537);
    			attr_dev(label, "for", "bg-color");
    			add_location(label, file$6, 133, 12, 3652);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-1pl6nbx");
    			add_location(a, file$6, 134, 12, 3711);
    			add_location(div, file$6, 132, 10, 3634);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$newTimeSpan*/ ctx[5].style["background-color"]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t2);
    			append_dev(div, a);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_2*/ ctx[19]),
    					listen_dev(a, "click", prevent_default(/*click_handler_2*/ ctx[20]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$newTimeSpan*/ 32) {
    				set_input_value(input, /*$newTimeSpan*/ ctx[5].style["background-color"]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(131:8) {#if $newTimeSpan.style['background-color'] !== null}",
    		ctx
    	});

    	return block;
    }

    // (150:8) {:else}
    function create_else_block_1$1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Set border color";
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-1pl6nbx");
    			add_location(a, file$6, 150, 10, 4390);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*click_handler_5*/ ctx[24]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(150:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (144:8) {#if $newTimeSpan.style['border-color'] !== null}
    function create_if_block_1$3(ctx) {
    	let input;
    	let t0;
    	let div;
    	let label;
    	let t2;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			label = element("label");
    			label.textContent = "Border color";
    			t2 = space();
    			a = element("a");
    			a.textContent = "unset";
    			attr_dev(input, "type", "color");
    			attr_dev(input, "id", "b-color");
    			attr_dev(input, "class", "svelte-1pl6nbx");
    			add_location(input, file$6, 144, 10, 4105);
    			attr_dev(label, "for", "b-color");
    			add_location(label, file$6, 146, 12, 4215);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-1pl6nbx");
    			add_location(a, file$6, 147, 12, 4269);
    			add_location(div, file$6, 145, 10, 4197);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$newTimeSpan*/ ctx[5].style["border-color"]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t2);
    			append_dev(div, a);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_3*/ ctx[22]),
    					listen_dev(a, "click", prevent_default(/*click_handler_4*/ ctx[23]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$newTimeSpan*/ 32) {
    				set_input_value(input, /*$newTimeSpan*/ ctx[5].style["border-color"]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(144:8) {#if $newTimeSpan.style['border-color'] !== null}",
    		ctx
    	});

    	return block;
    }

    // (163:8) {:else}
    function create_else_block$1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Set border width";
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-1pl6nbx");
    			add_location(a, file$6, 163, 10, 4952);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*click_handler_7*/ ctx[27]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(163:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (157:8) {#if $newTimeSpan.style['border-width'] !== null}
    function create_if_block$3(ctx) {
    	let input;
    	let t0;
    	let div;
    	let label;
    	let t2;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			label = element("label");
    			label.textContent = "Border width";
    			t2 = space();
    			a = element("a");
    			a.textContent = "unset";
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "9");
    			attr_dev(input, "id", "b-width");
    			attr_dev(input, "class", "svelte-1pl6nbx");
    			add_location(input, file$6, 157, 10, 4651);
    			attr_dev(label, "for", "b-width");
    			add_location(label, file$6, 159, 12, 4777);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-1pl6nbx");
    			add_location(a, file$6, 160, 12, 4831);
    			add_location(div, file$6, 158, 10, 4759);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$newTimeSpan*/ ctx[5].style["border-width"]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t2);
    			append_dev(div, a);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[25]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[25]),
    					listen_dev(a, "click", prevent_default(/*click_handler_6*/ ctx[26]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$newTimeSpan*/ 32) {
    				set_input_value(input, /*$newTimeSpan*/ ctx[5].style["border-width"]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(157:8) {#if $newTimeSpan.style['border-width'] !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div13;
    	let div0;
    	let t1;
    	let a;
    	let t2;
    	let div1;
    	let t3;
    	let div3;
    	let div2;
    	let t4;
    	let div12;
    	let div4;
    	let label0;
    	let t6;
    	let input;
    	let t7;
    	let div5;
    	let label1;
    	let t9;
    	let textarea;
    	let t10;
    	let div6;
    	let label2;
    	let t12;
    	let t13;
    	let div11;
    	let div7;
    	let t15;
    	let div8;
    	let t16;
    	let div9;
    	let t17;
    	let div10;
    	let t18;
    	let button;
    	let t19;
    	let button_disabled_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*$newTimeSpan*/ ctx[5].startDate) return create_if_block_5;
    		return create_else_block_5;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*$newTimeSpan*/ ctx[5].endDate) return create_if_block_4$1;
    		return create_else_block_4$1;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*categoryInputType*/ ctx[3] === "select") return create_if_block_3$2;
    		return create_else_block_3$1;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (/*$newTimeSpan*/ ctx[5].style["background-color"] !== null) return create_if_block_2$2;
    		return create_else_block_2$1;
    	}

    	let current_block_type_3 = select_block_type_3(ctx);
    	let if_block3 = current_block_type_3(ctx);

    	function select_block_type_4(ctx, dirty) {
    		if (/*$newTimeSpan*/ ctx[5].style["border-color"] !== null) return create_if_block_1$3;
    		return create_else_block_1$1;
    	}

    	let current_block_type_4 = select_block_type_4(ctx);
    	let if_block4 = current_block_type_4(ctx);

    	function select_block_type_5(ctx, dirty) {
    		if (/*$newTimeSpan*/ ctx[5].style["border-width"] !== null) return create_if_block$3;
    		return create_else_block$1;
    	}

    	let current_block_type_5 = select_block_type_5(ctx);
    	let if_block5 = current_block_type_5(ctx);

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			div0 = element("div");
    			div0.textContent = "Create time span";
    			t1 = space();
    			a = element("a");
    			t2 = space();
    			div1 = element("div");
    			if_block0.c();
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			if_block1.c();
    			t4 = space();
    			div12 = element("div");
    			div4 = element("div");
    			label0 = element("label");
    			label0.textContent = "Name";
    			t6 = space();
    			input = element("input");
    			t7 = space();
    			div5 = element("div");
    			label1 = element("label");
    			label1.textContent = "Description";
    			t9 = space();
    			textarea = element("textarea");
    			t10 = space();
    			div6 = element("div");
    			label2 = element("label");
    			label2.textContent = "Category";
    			t12 = space();
    			if_block2.c();
    			t13 = space();
    			div11 = element("div");
    			div7 = element("div");
    			div7.textContent = "Styling";
    			t15 = space();
    			div8 = element("div");
    			if_block3.c();
    			t16 = space();
    			div9 = element("div");
    			if_block4.c();
    			t17 = space();
    			div10 = element("div");
    			if_block5.c();
    			t18 = space();
    			button = element("button");
    			t19 = text("Create time span");
    			attr_dev(div0, "class", "title svelte-1pl6nbx");
    			add_location(div0, file$6, 80, 2, 1681);
    			attr_dev(a, "class", "close svelte-1pl6nbx");
    			add_location(a, file$6, 82, 2, 1726);
    			attr_dev(div1, "class", "step svelte-1pl6nbx");
    			toggle_class(div1, "is-active", /*step*/ ctx[0] === "start");
    			add_location(div1, file$6, 86, 2, 1814);
    			attr_dev(div2, "class", "substep svelte-1pl6nbx");
    			add_location(div2, file$6, 95, 4, 2126);
    			attr_dev(div3, "class", "step svelte-1pl6nbx");
    			toggle_class(div3, "is-active", /*step*/ ctx[0] === "end");
    			add_location(div3, file$6, 94, 2, 2070);
    			attr_dev(label0, "class", "substep-head svelte-1pl6nbx");
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$6, 107, 6, 2488);
    			attr_dev(input, "id", "name");
    			attr_dev(input, "class", "svelte-1pl6nbx");
    			add_location(input, file$6, 108, 6, 2546);
    			attr_dev(div4, "class", "substep svelte-1pl6nbx");
    			add_location(div4, file$6, 106, 4, 2460);
    			attr_dev(label1, "class", "substep-head svelte-1pl6nbx");
    			attr_dev(label1, "for", "description");
    			add_location(label1, file$6, 111, 6, 2660);
    			attr_dev(textarea, "id", "description");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "class", "svelte-1pl6nbx");
    			add_location(textarea, file$6, 112, 6, 2732);
    			attr_dev(div5, "class", "substep svelte-1pl6nbx");
    			add_location(div5, file$6, 110, 4, 2632);
    			attr_dev(label2, "class", "substep-head svelte-1pl6nbx");
    			attr_dev(label2, "for", "category");
    			add_location(label2, file$6, 115, 6, 2861);
    			attr_dev(div6, "class", "substep svelte-1pl6nbx");
    			add_location(div6, file$6, 114, 4, 2833);
    			attr_dev(div7, "class", "substep-head svelte-1pl6nbx");
    			add_location(div7, file$6, 128, 6, 3395);
    			attr_dev(div8, "class", "style-row svelte-1pl6nbx");
    			add_location(div8, file$6, 129, 6, 3441);
    			attr_dev(div9, "class", "style-row svelte-1pl6nbx");
    			add_location(div9, file$6, 142, 6, 4013);
    			attr_dev(div10, "class", "style-row svelte-1pl6nbx");
    			add_location(div10, file$6, 155, 6, 4559);
    			attr_dev(div11, "class", "substep svelte-1pl6nbx");
    			add_location(div11, file$6, 127, 4, 3367);
    			attr_dev(button, "class", "create-button svelte-1pl6nbx");
    			button.disabled = button_disabled_value = !/*$newTimeSpan*/ ctx[5].name?.trim() || !/*$newTimeSpan*/ ctx[5].category?.trim();
    			add_location(button, file$6, 170, 4, 5123);
    			attr_dev(div12, "class", "step svelte-1pl6nbx");
    			toggle_class(div12, "is-active", /*step*/ ctx[0] === "name");
    			add_location(div12, file$6, 105, 2, 2403);
    			attr_dev(div13, "class", "create-time-span svelte-1pl6nbx");
    			add_location(div13, file$6, 79, 0, 1648);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div0);
    			append_dev(div13, t1);
    			append_dev(div13, a);
    			a.innerHTML = CloseIcon;
    			append_dev(div13, t2);
    			append_dev(div13, div1);
    			if_block0.m(div1, null);
    			append_dev(div13, t3);
    			append_dev(div13, div3);
    			append_dev(div3, div2);
    			if_block1.m(div2, null);
    			append_dev(div13, t4);
    			append_dev(div13, div12);
    			append_dev(div12, div4);
    			append_dev(div4, label0);
    			append_dev(div4, t6);
    			append_dev(div4, input);
    			set_input_value(input, /*$newTimeSpan*/ ctx[5].name);
    			/*input_binding*/ ctx[15](input);
    			append_dev(div12, t7);
    			append_dev(div12, div5);
    			append_dev(div5, label1);
    			append_dev(div5, t9);
    			append_dev(div5, textarea);
    			set_input_value(textarea, /*$newTimeSpan*/ ctx[5].description);
    			append_dev(div12, t10);
    			append_dev(div12, div6);
    			append_dev(div6, label2);
    			append_dev(div6, t12);
    			if_block2.m(div6, null);
    			append_dev(div12, t13);
    			append_dev(div12, div11);
    			append_dev(div11, div7);
    			append_dev(div11, t15);
    			append_dev(div11, div8);
    			if_block3.m(div8, null);
    			append_dev(div11, t16);
    			append_dev(div11, div9);
    			if_block4.m(div9, null);
    			append_dev(div11, t17);
    			append_dev(div11, div10);
    			if_block5.m(div10, null);
    			append_dev(div12, t18);
    			append_dev(div12, button);
    			append_dev(button, t19);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*click_handler*/ ctx[12], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[14]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[16]),
    					listen_dev(button, "click", /*createTimeSpan*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div1, null);
    				}
    			}

    			if (dirty[0] & /*step*/ 1) {
    				toggle_class(div1, "is-active", /*step*/ ctx[0] === "start");
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			}

    			if (dirty[0] & /*step*/ 1) {
    				toggle_class(div3, "is-active", /*step*/ ctx[0] === "end");
    			}

    			if (dirty[0] & /*$newTimeSpan*/ 32 && input.value !== /*$newTimeSpan*/ ctx[5].name) {
    				set_input_value(input, /*$newTimeSpan*/ ctx[5].name);
    			}

    			if (dirty[0] & /*$newTimeSpan*/ 32) {
    				set_input_value(textarea, /*$newTimeSpan*/ ctx[5].description);
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div6, null);
    				}
    			}

    			if (current_block_type_3 === (current_block_type_3 = select_block_type_3(ctx)) && if_block3) {
    				if_block3.p(ctx, dirty);
    			} else {
    				if_block3.d(1);
    				if_block3 = current_block_type_3(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(div8, null);
    				}
    			}

    			if (current_block_type_4 === (current_block_type_4 = select_block_type_4(ctx)) && if_block4) {
    				if_block4.p(ctx, dirty);
    			} else {
    				if_block4.d(1);
    				if_block4 = current_block_type_4(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(div9, null);
    				}
    			}

    			if (current_block_type_5 === (current_block_type_5 = select_block_type_5(ctx)) && if_block5) {
    				if_block5.p(ctx, dirty);
    			} else {
    				if_block5.d(1);
    				if_block5 = current_block_type_5(ctx);

    				if (if_block5) {
    					if_block5.c();
    					if_block5.m(div10, null);
    				}
    			}

    			if (dirty[0] & /*$newTimeSpan*/ 32 && button_disabled_value !== (button_disabled_value = !/*$newTimeSpan*/ ctx[5].name?.trim() || !/*$newTimeSpan*/ ctx[5].category?.trim())) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty[0] & /*step*/ 1) {
    				toggle_class(div12, "is-active", /*step*/ ctx[0] === "name");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    			if_block0.d();
    			if_block1.d();
    			/*input_binding*/ ctx[15](null);
    			if_block2.d();
    			if_block3.d();
    			if_block4.d();
    			if_block5.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $clickedWeek;
    	let $newTimeSpan;
    	let $categories;
    	let $timeSpans;
    	let $appMode;
    	validate_store(clickedWeek, "clickedWeek");
    	component_subscribe($$self, clickedWeek, $$value => $$invalidate(4, $clickedWeek = $$value));
    	validate_store(newTimeSpan, "newTimeSpan");
    	component_subscribe($$self, newTimeSpan, $$value => $$invalidate(5, $newTimeSpan = $$value));
    	validate_store(categories, "categories");
    	component_subscribe($$self, categories, $$value => $$invalidate(6, $categories = $$value));
    	validate_store(timeSpans, "timeSpans");
    	component_subscribe($$self, timeSpans, $$value => $$invalidate(28, $timeSpans = $$value));
    	validate_store(appMode, "appMode");
    	component_subscribe($$self, appMode, $$value => $$invalidate(7, $appMode = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CreateTimeSpan", slots, []);
    	let step = "start";
    	let nameInput;
    	let catInput;
    	let categoryInputType = "select";
    	set_store_value(clickedWeek, $clickedWeek = null, $clickedWeek);

    	set_store_value(
    		newTimeSpan,
    		$newTimeSpan = {
    			startDate: null,
    			endDate: null,
    			name: "",
    			description: "",
    			category: $categories[0],
    			style: {
    				"background-color": "#00c3ff",
    				"border-color": null,
    				"border-width": null
    			}
    		},
    		$newTimeSpan
    	);

    	const unsubscribeClickedWeek = clickedWeek.subscribe(week => {
    		if (!week) {
    			return;
    		}

    		if (step === "start") {
    			set_store_value(newTimeSpan, $newTimeSpan.startDate = week.startDate, $newTimeSpan);
    			$$invalidate(0, step = "end");
    			return;
    		}

    		if (step === "end") {
    			set_store_value(newTimeSpan, $newTimeSpan.endDate = week.endDate, $newTimeSpan);
    			$$invalidate(0, step = "name");
    			nameInput.focus();
    		}
    	});

    	onDestroy(unsubscribeClickedWeek);

    	function createTimeSpan() {
    		set_store_value(timeSpans, $timeSpans = [...$timeSpans, $newTimeSpan], $timeSpans);
    		save("timeSpans", $timeSpans);
    		set_store_value(appMode, $appMode = "default", $appMode);
    	}

    	async function handleCategoryChange(event) {
    		if (event.target.value === "$$createNew") {
    			set_store_value(newTimeSpan, $newTimeSpan.category = "", $newTimeSpan);
    			$$invalidate(3, categoryInputType = "input");
    			await tick();
    			catInput.focus();
    		} else {
    			set_store_value(newTimeSpan, $newTimeSpan.category = event.target.value, $newTimeSpan);
    		}
    	}

    	function handleCatBlur(event) {
    		if (!event.target.value.trim()) {
    			set_store_value(newTimeSpan, $newTimeSpan.category = $categories[0], $newTimeSpan);
    			$$invalidate(3, categoryInputType = "select");
    		}
    	}

    	function setNull(key) {
    		set_store_value(newTimeSpan, $newTimeSpan.style[key] = null, $newTimeSpan);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CreateTimeSpan> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => set_store_value(appMode, $appMode = "default", $appMode);
    	const click_handler_1 = () => set_store_value(clickedWeek, $clickedWeek = { endDate: "ongoing" }, $clickedWeek);

    	function input_input_handler() {
    		$newTimeSpan.name = this.value;
    		newTimeSpan.set($newTimeSpan);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			nameInput = $$value;
    			$$invalidate(1, nameInput);
    		});
    	}

    	function textarea_input_handler() {
    		$newTimeSpan.description = this.value;
    		newTimeSpan.set($newTimeSpan);
    	}

    	function input_input_handler_1() {
    		$newTimeSpan.category = this.value;
    		newTimeSpan.set($newTimeSpan);
    	}

    	function input_binding_1($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			catInput = $$value;
    			$$invalidate(2, catInput);
    		});
    	}

    	function input_input_handler_2() {
    		$newTimeSpan.style["background-color"] = this.value;
    		newTimeSpan.set($newTimeSpan);
    	}

    	const click_handler_2 = () => setNull("background-color");
    	const click_handler_3 = () => set_store_value(newTimeSpan, $newTimeSpan.style["background-color"] = "#00c3ff", $newTimeSpan);

    	function input_input_handler_3() {
    		$newTimeSpan.style["border-color"] = this.value;
    		newTimeSpan.set($newTimeSpan);
    	}

    	const click_handler_4 = () => setNull("border-color");
    	const click_handler_5 = () => set_store_value(newTimeSpan, $newTimeSpan.style["border-color"] = "#000000", $newTimeSpan);

    	function input_change_input_handler() {
    		$newTimeSpan.style["border-width"] = to_number(this.value);
    		newTimeSpan.set($newTimeSpan);
    	}

    	const click_handler_6 = () => setNull("border-width");
    	const click_handler_7 = () => set_store_value(newTimeSpan, $newTimeSpan.style["border-width"] = 1, $newTimeSpan);

    	$$self.$capture_state = () => ({
    		tick,
    		onDestroy,
    		appMode,
    		timeSpans,
    		categories,
    		newTimeSpan,
    		clickedWeek,
    		save,
    		CloseIcon,
    		step,
    		nameInput,
    		catInput,
    		categoryInputType,
    		unsubscribeClickedWeek,
    		createTimeSpan,
    		handleCategoryChange,
    		handleCatBlur,
    		setNull,
    		$clickedWeek,
    		$newTimeSpan,
    		$categories,
    		$timeSpans,
    		$appMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("step" in $$props) $$invalidate(0, step = $$props.step);
    		if ("nameInput" in $$props) $$invalidate(1, nameInput = $$props.nameInput);
    		if ("catInput" in $$props) $$invalidate(2, catInput = $$props.catInput);
    		if ("categoryInputType" in $$props) $$invalidate(3, categoryInputType = $$props.categoryInputType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		step,
    		nameInput,
    		catInput,
    		categoryInputType,
    		$clickedWeek,
    		$newTimeSpan,
    		$categories,
    		$appMode,
    		createTimeSpan,
    		handleCategoryChange,
    		handleCatBlur,
    		setNull,
    		click_handler,
    		click_handler_1,
    		input_input_handler,
    		input_binding,
    		textarea_input_handler,
    		input_input_handler_1,
    		input_binding_1,
    		input_input_handler_2,
    		click_handler_2,
    		click_handler_3,
    		input_input_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input_change_input_handler,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class CreateTimeSpan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateTimeSpan",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/WeekDot.svelte generated by Svelte v3.38.2 */
    const file$5 = "src/WeekDot.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let div1_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "week svelte-1k6qf8a");
    			attr_dev(div0, "style", /*style*/ ctx[3]);
    			add_location(div0, file$5, 49, 2, 1479);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*classNames*/ ctx[2]) + " svelte-1k6qf8a"));
    			add_location(div1, file$5, 46, 0, 1321);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "mouseenter", /*mouseenter_handler*/ ctx[9], false, false, false),
    					listen_dev(div1, "mouseleave", /*mouseleave_handler*/ ctx[10], false, false, false),
    					listen_dev(div1, "click", /*click_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 8) {
    				attr_dev(div0, "style", /*style*/ ctx[3]);
    			}

    			if (dirty & /*classNames*/ 4 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*classNames*/ ctx[2]) + " svelte-1k6qf8a"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $settings;
    	let $currentWeek;
    	let $appMode;
    	let $newTimeSpan;
    	let $timeSpans;
    	let $clickedWeek;
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(5, $settings = $$value));
    	validate_store(currentWeek, "currentWeek");
    	component_subscribe($$self, currentWeek, $$value => $$invalidate(1, $currentWeek = $$value));
    	validate_store(appMode, "appMode");
    	component_subscribe($$self, appMode, $$value => $$invalidate(6, $appMode = $$value));
    	validate_store(newTimeSpan, "newTimeSpan");
    	component_subscribe($$self, newTimeSpan, $$value => $$invalidate(7, $newTimeSpan = $$value));
    	validate_store(timeSpans, "timeSpans");
    	component_subscribe($$self, timeSpans, $$value => $$invalidate(8, $timeSpans = $$value));
    	validate_store(clickedWeek, "clickedWeek");
    	component_subscribe($$self, clickedWeek, $$value => $$invalidate(4, $clickedWeek = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("WeekDot", slots, []);
    	let { week } = $$props;
    	let classNames;
    	let style = "";
    	const writable_props = ["week"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WeekDot> was created with unknown prop '${key}'`);
    	});

    	const mouseenter_handler = () => set_store_value(currentWeek, $currentWeek = week, $currentWeek);
    	const mouseleave_handler = () => set_store_value(currentWeek, $currentWeek = null, $currentWeek);
    	const click_handler = () => set_store_value(clickedWeek, $clickedWeek = week, $clickedWeek);

    	$$self.$$set = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    	};

    	$$self.$capture_state = () => ({
    		appMode,
    		currentWeek,
    		settings,
    		clickedWeek,
    		timeSpans,
    		newTimeSpan,
    		isMarked,
    		isDisabled,
    		assembleStylesMap,
    		makeStyleString,
    		today,
    		week,
    		classNames,
    		style,
    		$settings,
    		$currentWeek,
    		$appMode,
    		$newTimeSpan,
    		$timeSpans,
    		$clickedWeek
    	});

    	$$self.$inject_state = $$props => {
    		if ("week" in $$props) $$invalidate(0, week = $$props.week);
    		if ("classNames" in $$props) $$invalidate(2, classNames = $$props.classNames);
    		if ("style" in $$props) $$invalidate(3, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$settings, week, $currentWeek, $appMode, $newTimeSpan*/ 227) {
    			{
    				const classMap = {
    					"is-past": $settings.showPast && week.endDate <= today,
    					"is-now": $settings.blinkNow && week.startDate <= today && week.endDate >= today,
    					"is-hovered": $currentWeek && week.startDate <= $currentWeek.endDate && week.endDate >= $currentWeek.startDate,
    					"is-disabled": isDisabled($appMode, $newTimeSpan, week)
    				};

    				let classCollection = ["week-wrapper"];

    				for (let className in classMap) {
    					if (classMap[className]) {
    						classCollection.push(className);
    					}
    				}

    				for (let timeSpan of week.matchedTimeSpans) {
    					classCollection.push(timeSpan.id);
    				}

    				$$invalidate(2, classNames = classCollection.join(" "));
    			}
    		}

    		if ($$self.$$.dirty & /*$timeSpans, week*/ 257) {
    			{
    				$$invalidate(3, style = makeStyleString(assembleStylesMap(week)));
    			}
    		}

    		if ($$self.$$.dirty & /*$appMode, $newTimeSpan, $currentWeek, week*/ 195) {
    			{
    				if (isMarked($appMode, $newTimeSpan, $currentWeek, week)) {
    					$$invalidate(3, style = makeStyleString(assembleStylesMap(week, $newTimeSpan.style)));
    				} else {
    					$$invalidate(3, style = makeStyleString(assembleStylesMap(week)));
    				}
    			}
    		}
    	};

    	return [
    		week,
    		$currentWeek,
    		classNames,
    		style,
    		$clickedWeek,
    		$settings,
    		$appMode,
    		$newTimeSpan,
    		$timeSpans,
    		mouseenter_handler,
    		mouseleave_handler,
    		click_handler
    	];
    }

    class WeekDot extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { week: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeekDot",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*week*/ ctx[0] === undefined && !("week" in props)) {
    			console.warn("<WeekDot> was created without expected prop 'week'");
    		}
    	}

    	get week() {
    		throw new Error("<WeekDot>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set week(value) {
    		throw new Error("<WeekDot>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Calendar.svelte generated by Svelte v3.38.2 */
    const file$4 = "src/Calendar.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (38:4) {#each [...Array(52).keys()] as week}
    function create_each_block_2(ctx) {
    	let div;
    	let t_value = /*week*/ ctx[7] + 1 + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "label week-label svelte-1xzrcqo");
    			set_style(div, "margin", "0.2rem");
    			add_location(div, file$4, 38, 6, 968);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(38:4) {#each [...Array(52).keys()] as week}",
    		ctx
    	});

    	return block;
    }

    // (47:6) {#each year.weeks as week}
    function create_each_block_1(ctx) {
    	let weekdot;
    	let current;

    	weekdot = new WeekDot({
    			props: { week: /*week*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(weekdot.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(weekdot, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const weekdot_changes = {};
    			if (dirty & /*allYears*/ 1) weekdot_changes.week = /*week*/ ctx[7];
    			weekdot.$set(weekdot_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(weekdot.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(weekdot.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(weekdot, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(47:6) {#each year.weeks as week}",
    		ctx
    	});

    	return block;
    }

    // (42:2) {#each allYears as year}
    function create_each_block$2(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*year*/ ctx[4].age + "";
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	let each_value_1 = /*year*/ ctx[4].weeks;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(div0, "class", "label year-label svelte-1xzrcqo");
    			add_location(div0, file$4, 43, 6, 1115);
    			attr_dev(div1, "class", "year svelte-1xzrcqo");
    			add_location(div1, file$4, 42, 4, 1090);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*allYears*/ 1) && t0_value !== (t0_value = /*year*/ ctx[4].age + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*allYears*/ 1) {
    				each_value_1 = /*year*/ ctx[4].weeks;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, t2);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(42:2) {#each allYears as year}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div5;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t3;
    	let div4;
    	let div3;
    	let t5;
    	let t6;
    	let current;
    	let each_value_2 = [...Array(52).keys()];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*allYears*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = " ";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "weeks";
    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div3.textContent = "age";
    			t5 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "year-label svelte-1xzrcqo");
    			add_location(div0, file$4, 32, 4, 772);
    			set_style(div1, "flex", "1");
    			add_location(div1, file$4, 33, 4, 813);
    			attr_dev(div2, "class", "year svelte-1xzrcqo");
    			add_location(div2, file$4, 31, 2, 749);
    			attr_dev(div3, "class", "label year-label svelte-1xzrcqo");
    			add_location(div3, file$4, 36, 4, 880);
    			attr_dev(div4, "class", "year svelte-1xzrcqo");
    			add_location(div4, file$4, 35, 2, 857);
    			attr_dev(div5, "class", "life svelte-1xzrcqo");
    			add_location(div5, file$4, 30, 0, 728);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div4, t5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div4, null);
    			}

    			append_dev(div5, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Array*/ 0) {
    				each_value_2 = [...Array(52).keys()];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*allYears*/ 1) {
    				each_value = /*allYears*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div5, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $dobString;
    	let $timeSpans;
    	validate_store(dobString, "dobString");
    	component_subscribe($$self, dobString, $$value => $$invalidate(2, $dobString = $$value));
    	validate_store(timeSpans, "timeSpans");
    	component_subscribe($$self, timeSpans, $$value => $$invalidate(3, $timeSpans = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Calendar", slots, []);
    	let dateOfBirth;
    	let allYears;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Calendar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		WeekDot,
    		generateYears,
    		today,
    		dobString,
    		timeSpans,
    		dateOfBirth,
    		allYears,
    		$dobString,
    		$timeSpans
    	});

    	$$self.$inject_state = $$props => {
    		if ("dateOfBirth" in $$props) $$invalidate(1, dateOfBirth = $$props.dateOfBirth);
    		if ("allYears" in $$props) $$invalidate(0, allYears = $$props.allYears);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$dobString, dateOfBirth*/ 6) {
    			{
    				$$invalidate(1, dateOfBirth = new Date($dobString));
    				$$invalidate(0, allYears = generateYears(dateOfBirth));
    			}
    		}

    		if ($$self.$$.dirty & /*allYears, $timeSpans*/ 9) {
    			{
    				for (let year of allYears) {
    					for (let week of year.weeks) {
    						week.matchedTimeSpans = [];

    						for (let timeSpan of $timeSpans) {
    							if (week.startDate < (timeSpan.endDate === "ongoing"
    							? today
    							: timeSpan.endDate) && week.endDate > timeSpan.startDate) {
    								week.matchedTimeSpans = [...week.matchedTimeSpans, timeSpan];
    							}
    						}
    					}
    				}
    			}
    		}
    	};

    	return [allYears, dateOfBirth, $dobString, $timeSpans];
    }

    class Calendar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Calendar",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Settings.svelte generated by Svelte v3.38.2 */
    const file$3 = "src/Settings.svelte";

    function create_fragment$4(ctx) {
    	let div4;
    	let div0;
    	let t1;
    	let a;
    	let t2;
    	let div1;
    	let label0;
    	let input0;
    	let t3;
    	let t4;
    	let label1;
    	let input1;
    	let t5;
    	let t6;
    	let div2;
    	let t8;
    	let div3;
    	let p0;
    	let t10;
    	let button0;
    	let t12;
    	let p1;
    	let t14;
    	let p2;
    	let strong;
    	let t16;
    	let button1;
    	let t18;
    	let input2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			div0.textContent = "Settings";
    			t1 = space();
    			a = element("a");
    			t2 = space();
    			div1 = element("div");
    			label0 = element("label");
    			input0 = element("input");
    			t3 = text(" Paint past weeks in gray");
    			t4 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t5 = text(" Blink current week");
    			t6 = space();
    			div2 = element("div");
    			div2.textContent = "Import/Export";
    			t8 = space();
    			div3 = element("div");
    			p0 = element("p");
    			p0.textContent = "Export your data to a .json file";
    			t10 = space();
    			button0 = element("button");
    			button0.textContent = "Export to file";
    			t12 = space();
    			p1 = element("p");
    			p1.textContent = "Import your data from a previously exported .json file";
    			t14 = space();
    			p2 = element("p");
    			strong = element("strong");
    			strong.textContent = "WARNING: All current data will be irreversibly overwritten\n        by the contents of the import file.";
    			t16 = space();
    			button1 = element("button");
    			button1.textContent = "Import from file";
    			t18 = space();
    			input2 = element("input");
    			attr_dev(div0, "class", "title svelte-1w46dm1");
    			add_location(div0, file$3, 67, 2, 1668);
    			attr_dev(a, "class", "close svelte-1w46dm1");
    			add_location(a, file$3, 69, 2, 1705);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$3, 75, 6, 1815);
    			attr_dev(label0, "class", "svelte-1w46dm1");
    			add_location(label0, file$3, 74, 4, 1801);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$3, 78, 6, 1929);
    			attr_dev(label1, "class", "svelte-1w46dm1");
    			add_location(label1, file$3, 77, 4, 1915);
    			attr_dev(div1, "class", "checkboxes svelte-1w46dm1");
    			add_location(div1, file$3, 73, 2, 1772);
    			attr_dev(div2, "class", "title svelte-1w46dm1");
    			add_location(div2, file$3, 82, 2, 2031);
    			attr_dev(p0, "class", "small svelte-1w46dm1");
    			add_location(p0, file$3, 85, 4, 2097);
    			add_location(button0, file$3, 86, 4, 2155);
    			attr_dev(p1, "class", "small svelte-1w46dm1");
    			add_location(p1, file$3, 90, 4, 2226);
    			add_location(strong, file$3, 94, 6, 2342);
    			attr_dev(p2, "class", "small svelte-1w46dm1");
    			add_location(p2, file$3, 93, 4, 2318);
    			add_location(button1, file$3, 99, 4, 2491);
    			attr_dev(input2, "type", "file");
    			set_style(input2, "display", "none");
    			add_location(input2, file$3, 102, 4, 2563);
    			attr_dev(div3, "class", "impex svelte-1w46dm1");
    			add_location(div3, file$3, 84, 2, 2073);
    			attr_dev(div4, "class", "settings svelte-1w46dm1");
    			add_location(div4, file$3, 66, 0, 1623);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t1);
    			append_dev(div4, a);
    			a.innerHTML = CloseIcon;
    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, label0);
    			append_dev(label0, input0);
    			input0.checked = /*$settings*/ ctx[0].showPast;
    			append_dev(label0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, label1);
    			append_dev(label1, input1);
    			input1.checked = /*$settings*/ ctx[0].blinkNow;
    			append_dev(label1, t5);
    			append_dev(div4, t6);
    			append_dev(div4, div2);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, p0);
    			append_dev(div3, t10);
    			append_dev(div3, button0);
    			append_dev(div3, t12);
    			append_dev(div3, p1);
    			append_dev(div3, t14);
    			append_dev(div3, p2);
    			append_dev(p2, strong);
    			append_dev(div3, t16);
    			append_dev(div3, button1);
    			append_dev(div3, t18);
    			append_dev(div3, input2);
    			/*input2_binding*/ ctx[8](input2);
    			/*div4_binding*/ ctx[9](div4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*close*/ ctx[3], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[6]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[7]),
    					listen_dev(button0, "click", /*exportFile*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*importFile*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$settings*/ 1) {
    				input0.checked = /*$settings*/ ctx[0].showPast;
    			}

    			if (dirty & /*$settings*/ 1) {
    				input1.checked = /*$settings*/ ctx[0].blinkNow;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			/*input2_binding*/ ctx[8](null);
    			/*div4_binding*/ ctx[9](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $showSettings;
    	let $settings;
    	validate_store(showSettings, "showSettings");
    	component_subscribe($$self, showSettings, $$value => $$invalidate(10, $showSettings = $$value));
    	validate_store(settings, "settings");
    	component_subscribe($$self, settings, $$value => $$invalidate(0, $settings = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Settings", slots, []);
    	let domNode;
    	let fileInput;

    	function close(event) {
    		set_store_value(showSettings, $showSettings = false, $showSettings);
    	}

    	function exportFile() {
    		const exp = {
    			dateOfBirth: load("dateOfBirth"),
    			timeSpans: load("timeSpans"),
    			settings: load("settings")
    		};

    		const tmpElm = document.createElement("a");
    		tmpElm.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(exp)));
    		tmpElm.setAttribute("download", "your-life.json");
    		tmpElm.style.display = "none";
    		document.body.appendChild(tmpElm);
    		tmpElm.click();
    		document.body.removeChild(tmpElm);
    	}

    	onMount(() => {
    		fileInput.addEventListener("change", event => {
    			const reader = new FileReader();

    			reader.addEventListener("load", event => {
    				try {
    					const imp = JSON.parse(event.target.result);
    					save("dateOfBirth", imp.dateOfBirth);
    					save("timeSpans", imp.timeSpans);
    					save("settings", imp.settings);
    					alert("Import successful. Reloading page.");
    					location.reload();
    				} catch(e) {
    					alert("Error importing file: " + e.message);
    				}
    			});

    			reader.readAsText(event.target.files[0], "UTF-8");
    		});
    	});

    	function importFile() {
    		if (window.confirm("Do you really want to irreversibly overwrite your current data?")) {
    			fileInput.click();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		$settings.showPast = this.checked;
    		settings.set($settings);
    	}

    	function input1_change_handler() {
    		$settings.blinkNow = this.checked;
    		settings.set($settings);
    	}

    	function input2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			fileInput = $$value;
    			$$invalidate(2, fileInput);
    		});
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			domNode = $$value;
    			$$invalidate(1, domNode);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		settings,
    		showSettings,
    		CloseIcon,
    		save,
    		load,
    		domNode,
    		fileInput,
    		close,
    		exportFile,
    		importFile,
    		$showSettings,
    		$settings
    	});

    	$$self.$inject_state = $$props => {
    		if ("domNode" in $$props) $$invalidate(1, domNode = $$props.domNode);
    		if ("fileInput" in $$props) $$invalidate(2, fileInput = $$props.fileInput);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$settings*/ 1) {
    			{
    				save("settings", $settings);
    			}
    		}
    	};

    	return [
    		$settings,
    		domNode,
    		fileInput,
    		close,
    		exportFile,
    		importFile,
    		input0_change_handler,
    		input1_change_handler,
    		input2_binding,
    		div4_binding
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    var EditIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\"><!-- Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d=\"M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z\"/></svg>";

    var TrashIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\"><!-- Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d=\"M268 416h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12zM432 80h-82.41l-34-56.7A48 48 0 0 0 274.41 0H173.59a48 48 0 0 0-41.16 23.3L98.41 80H16A16 16 0 0 0 0 96v16a16 16 0 0 0 16 16h16v336a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128h16a16 16 0 0 0 16-16V96a16 16 0 0 0-16-16zM171.84 50.91A6 6 0 0 1 177 48h94a6 6 0 0 1 5.15 2.91L293.61 80H154.39zM368 464H80V128h288zm-212-48h24a12 12 0 0 0 12-12V188a12 12 0 0 0-12-12h-24a12 12 0 0 0-12 12v216a12 12 0 0 0 12 12z\"/></svg>";

    var UpIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\"><!-- Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d=\"M34.9 289.5l-22.2-22.2c-9.4-9.4-9.4-24.6 0-33.9L207 39c9.4-9.4 24.6-9.4 33.9 0l194.3 194.3c9.4 9.4 9.4 24.6 0 33.9L413 289.4c-9.5 9.5-25 9.3-34.3-.4L264 168.6V456c0 13.3-10.7 24-24 24h-32c-13.3 0-24-10.7-24-24V168.6L69.2 289.1c-9.3 9.8-24.8 10-34.3.4z\"/></svg>";

    var DownIcon = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 448 512\"><!-- Font Awesome Free 5.15.3 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License) --><path d=\"M413.1 222.5l22.2 22.2c9.4 9.4 9.4 24.6 0 33.9L241 473c-9.4 9.4-24.6 9.4-33.9 0L12.7 278.6c-9.4-9.4-9.4-24.6 0-33.9l22.2-22.2c9.5-9.5 25-9.3 34.3.4L184 343.4V56c0-13.3 10.7-24 24-24h32c13.3 0 24 10.7 24 24v287.4l114.8-120.5c9.3-9.8 24.8-10 34.3-.4z\"/></svg>";

    /* src/EditTimeSpans.svelte generated by Svelte v3.38.2 */
    const file$2 = "src/EditTimeSpans.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[12] = i;
    	return child_ctx;
    }

    // (49:10) {#if idx > 0}
    function create_if_block_1$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[8](/*idx*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "svelte-u91456");
    			add_location(button, file$2, 49, 12, 1442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			button.innerHTML = UpIcon;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(49:10) {#if idx > 0}",
    		ctx
    	});

    	return block;
    }

    // (52:10) {#if idx < $timeSpans.length - 1}
    function create_if_block$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[9](/*idx*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "svelte-u91456");
    			add_location(button, file$2, 52, 11, 1576);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			button.innerHTML = DownIcon;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(52:10) {#if idx < $timeSpans.length - 1}",
    		ctx
    	});

    	return block;
    }

    // (43:4) {#each $timeSpans as timeSpan, idx}
    function create_each_block$1(ctx) {
    	let div1;
    	let spandetail;
    	let t0;
    	let div0;
    	let button0;
    	let t1;
    	let button1;
    	let t2;
    	let t3;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;

    	spandetail = new SpanDetail({
    			props: { timeSpan: /*timeSpan*/ ctx[10] },
    			$$inline: true
    		});

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[6](/*idx*/ ctx[12]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[7](/*idx*/ ctx[12]);
    	}

    	let if_block0 = /*idx*/ ctx[12] > 0 && create_if_block_1$2(ctx);
    	let if_block1 = /*idx*/ ctx[12] < /*$timeSpans*/ ctx[0].length - 1 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			create_component(spandetail.$$.fragment);
    			t0 = space();
    			div0 = element("div");
    			button0 = element("button");
    			t1 = space();
    			button1 = element("button");
    			t2 = space();
    			if (if_block0) if_block0.c();
    			t3 = space();
    			if (if_block1) if_block1.c();
    			t4 = space();
    			attr_dev(button0, "class", "svelte-u91456");
    			add_location(button0, file$2, 46, 10, 1266);
    			attr_dev(button1, "class", "svelte-u91456");
    			add_location(button1, file$2, 47, 10, 1342);
    			attr_dev(div0, "class", "buttons svelte-u91456");
    			add_location(div0, file$2, 45, 8, 1234);
    			attr_dev(div1, "class", "list-item svelte-u91456");
    			add_location(div1, file$2, 43, 6, 1160);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			mount_component(spandetail, div1, null);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			button0.innerHTML = EditIcon;
    			append_dev(div0, t1);
    			append_dev(div0, button1);
    			button1.innerHTML = TrashIcon;
    			append_dev(div0, t2);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t3);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div1, t4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler_1, false, false, false),
    					listen_dev(button1, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const spandetail_changes = {};
    			if (dirty & /*$timeSpans*/ 1) spandetail_changes.timeSpan = /*timeSpan*/ ctx[10];
    			spandetail.$set(spandetail_changes);
    			if (/*idx*/ ctx[12] > 0) if_block0.p(ctx, dirty);

    			if (/*idx*/ ctx[12] < /*$timeSpans*/ ctx[0].length - 1) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spandetail.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spandetail.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(spandetail);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(43:4) {#each $timeSpans as timeSpan, idx}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let p;
    	let t3;
    	let a;
    	let t4;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*$timeSpans*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Edit time spans";
    			t1 = space();
    			p = element("p");
    			p.textContent = "For overlapping time spans, styles farther down will appear \"on top\".";
    			t3 = space();
    			a = element("a");
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "title svelte-u91456");
    			add_location(div0, file$2, 31, 2, 818);
    			attr_dev(p, "class", "info svelte-u91456");
    			add_location(p, file$2, 33, 2, 862);
    			attr_dev(a, "class", "close svelte-u91456");
    			add_location(a, file$2, 37, 2, 963);
    			attr_dev(div1, "class", "spans-list svelte-u91456");
    			toggle_class(div1, "is-disabled", /*$editIdx*/ ctx[2] !== null);
    			add_location(div1, file$2, 41, 2, 1051);
    			attr_dev(div2, "class", "edit-time-spans svelte-u91456");
    			add_location(div2, file$2, 30, 0, 786);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, p);
    			append_dev(div2, t3);
    			append_dev(div2, a);
    			a.innerHTML = CloseIcon;
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*move, DownIcon, $timeSpans, UpIcon, remove, TrashIcon, $editIdx, EditIcon*/ 29) {
    				each_value = /*$timeSpans*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div1, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (dirty & /*$editIdx*/ 4) {
    				toggle_class(div1, "is-disabled", /*$editIdx*/ ctx[2] !== null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $timeSpans;
    	let $appMode;
    	let $editIdx;
    	validate_store(timeSpans, "timeSpans");
    	component_subscribe($$self, timeSpans, $$value => $$invalidate(0, $timeSpans = $$value));
    	validate_store(appMode, "appMode");
    	component_subscribe($$self, appMode, $$value => $$invalidate(1, $appMode = $$value));
    	validate_store(editIdx, "editIdx");
    	component_subscribe($$self, editIdx, $$value => $$invalidate(2, $editIdx = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EditTimeSpans", slots, []);

    	function move(idx, direction) {
    		set_store_value(timeSpans, [$timeSpans[idx + direction], $timeSpans[idx]] = [$timeSpans[idx], $timeSpans[idx + direction]], $timeSpans);
    		save("timeSpans", $timeSpans);
    	}

    	function remove(idx) {
    		if (!window.confirm("Really delete?")) {
    			return;
    		}

    		set_store_value(timeSpans, $timeSpans = [...$timeSpans.slice(0, idx), ...$timeSpans.slice(idx + 1)], $timeSpans);
    		save("timeSpans", $timeSpans);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EditTimeSpans> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => set_store_value(appMode, $appMode = "default", $appMode);
    	const click_handler_1 = idx => set_store_value(editIdx, $editIdx = idx, $editIdx);
    	const click_handler_2 = idx => remove(idx);
    	const click_handler_3 = idx => move(idx, -1);
    	const click_handler_4 = idx => move(idx, 1);

    	$$self.$capture_state = () => ({
    		appMode,
    		timeSpans,
    		editIdx,
    		save,
    		SpanDetail,
    		CloseIcon,
    		EditIcon,
    		TrashIcon,
    		UpIcon,
    		DownIcon,
    		move,
    		remove,
    		$timeSpans,
    		$appMode,
    		$editIdx
    	});

    	return [
    		$timeSpans,
    		$appMode,
    		$editIdx,
    		move,
    		remove,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class EditTimeSpans extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditTimeSpans",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/EditTimeSpan.svelte generated by Svelte v3.38.2 */
    const file$1 = "src/EditTimeSpan.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    // (63:6) {:else}
    function create_else_block_4(ctx) {
    	let datepicker;
    	let updating_dateString;
    	let br;
    	let t0;
    	let a;
    	let current;
    	let mounted;
    	let dispose;

    	function datepicker_dateString_binding_1(value) {
    		/*datepicker_dateString_binding_1*/ ctx[13](value);
    	}

    	let datepicker_props = {
    		startYear: parseInt(/*$dobString*/ ctx[5].substr(0, 4))
    	};

    	if (/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].endDate !== void 0) {
    		datepicker_props.dateString = /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].endDate;
    	}

    	datepicker = new DatePicker({ props: datepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(datepicker, "dateString", datepicker_dateString_binding_1));

    	const block = {
    		c: function create() {
    			create_component(datepicker.$$.fragment);
    			br = element("br");
    			t0 = space();
    			a = element("a");
    			a.textContent = "set to ongoing";
    			add_location(br, file$1, 63, 114, 1849);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "small-link svelte-2szal3");
    			add_location(a, file$1, 64, 8, 1862);
    		},
    		m: function mount(target, anchor) {
    			mount_component(datepicker, target, anchor);
    			insert_dev(target, br, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*click_handler_1*/ ctx[14]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const datepicker_changes = {};
    			if (dirty[0] & /*$dobString*/ 32) datepicker_changes.startYear = parseInt(/*$dobString*/ ctx[5].substr(0, 4));

    			if (!updating_dateString && dirty[0] & /*$timeSpans, $editIdx*/ 12) {
    				updating_dateString = true;
    				datepicker_changes.dateString = /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].endDate;
    				add_flush_callback(() => updating_dateString = false);
    			}

    			datepicker.$set(datepicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(datepicker, detaching);
    			if (detaching) detach_dev(br);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(63:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:6) {#if $timeSpans[$editIdx].endDate === 'ongoing'}
    function create_if_block_4(ctx) {
    	let t0;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text("ongoing ");
    			a = element("a");
    			a.textContent = "set a date";
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "small-link svelte-2szal3");
    			add_location(a, file$1, 61, 16, 1606);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*click_handler*/ ctx[12]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(61:6) {#if $timeSpans[$editIdx].endDate === 'ongoing'}",
    		ctx
    	});

    	return block;
    }

    // (88:6) {:else}
    function create_else_block_3(ctx) {
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "id", "category");
    			attr_dev(input, "class", "svelte-2szal3");
    			add_location(input, file$1, 88, 8, 2853);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].category);
    			/*input_binding*/ ctx[18](input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_1*/ ctx[17]),
    					listen_dev(input, "blur", /*handleCatBlur*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$timeSpans, $editIdx, $categories*/ 28 && input.value !== /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].category) {
    				set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].category);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			/*input_binding*/ ctx[18](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(88:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:6) {#if categoryInputType === 'select'}
    function create_if_block_3$1(ctx) {
    	let select;
    	let option;
    	let select_value_value;
    	let mounted;
    	let dispose;
    	let each_value = /*$categories*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option = element("option");
    			option.textContent = "Create new category...";
    			option.__value = "$$createNew";
    			option.value = option.__value;
    			add_location(option, file$1, 85, 10, 2753);
    			attr_dev(select, "id", "category");
    			add_location(select, file$1, 81, 8, 2549);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			append_dev(select, option);
    			select_option(select, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].category);

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*handleCategoryChange*/ ctx[8], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$categories*/ 16) {
    				each_value = /*$categories*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, option);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty[0] & /*$timeSpans, $editIdx, $categories*/ 28 && select_value_value !== (select_value_value = /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].category)) {
    				select_option(select, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].category);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(81:6) {#if categoryInputType === 'select'}",
    		ctx
    	});

    	return block;
    }

    // (83:10) {#each $categories as category}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*category*/ ctx[29] + "";
    	let t;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*category*/ ctx[29];
    			option.value = option.__value;
    			add_location(option, file$1, 83, 12, 2697);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$categories*/ 16 && t_value !== (t_value = /*category*/ ctx[29] + "")) set_data_dev(t, t_value);

    			if (dirty[0] & /*$categories*/ 16 && option_value_value !== (option_value_value = /*category*/ ctx[29])) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(83:10) {#each $categories as category}",
    		ctx
    	});

    	return block;
    }

    // (101:8) {:else}
    function create_else_block_2(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Set background color";
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-2szal3");
    			add_location(a, file$1, 101, 10, 3475);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*click_handler_3*/ ctx[21]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(101:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (95:8) {#if $timeSpans[$editIdx].style['background-color'] !== null}
    function create_if_block_2$1(ctx) {
    	let input;
    	let t0;
    	let div;
    	let label;
    	let t2;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			label = element("label");
    			label.textContent = "Background color";
    			t2 = space();
    			a = element("a");
    			a.textContent = "unset";
    			attr_dev(input, "type", "color");
    			attr_dev(input, "id", "bg-color");
    			attr_dev(input, "class", "svelte-2szal3");
    			add_location(input, file$1, 95, 10, 3168);
    			attr_dev(label, "for", "bg-color");
    			add_location(label, file$1, 97, 12, 3291);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-2szal3");
    			add_location(a, file$1, 98, 12, 3350);
    			add_location(div, file$1, 96, 10, 3273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["background-color"]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t2);
    			append_dev(div, a);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_2*/ ctx[19]),
    					listen_dev(a, "click", prevent_default(/*click_handler_2*/ ctx[20]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$timeSpans, $editIdx, $categories*/ 28) {
    				set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["background-color"]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(95:8) {#if $timeSpans[$editIdx].style['background-color'] !== null}",
    		ctx
    	});

    	return block;
    }

    // (114:8) {:else}
    function create_else_block_1(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Set border color";
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-2szal3");
    			add_location(a, file$1, 114, 10, 4053);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*click_handler_5*/ ctx[24]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(114:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (108:8) {#if $timeSpans[$editIdx].style['border-color'] !== null}
    function create_if_block_1$1(ctx) {
    	let input;
    	let t0;
    	let div;
    	let label;
    	let t2;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			label = element("label");
    			label.textContent = "Border color";
    			t2 = space();
    			a = element("a");
    			a.textContent = "unset";
    			attr_dev(input, "type", "color");
    			attr_dev(input, "id", "b-color");
    			attr_dev(input, "class", "svelte-2szal3");
    			add_location(input, file$1, 108, 10, 3760);
    			attr_dev(label, "for", "b-color");
    			add_location(label, file$1, 110, 12, 3878);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-2szal3");
    			add_location(a, file$1, 111, 12, 3932);
    			add_location(div, file$1, 109, 10, 3860);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["border-color"]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t2);
    			append_dev(div, a);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler_3*/ ctx[22]),
    					listen_dev(a, "click", prevent_default(/*click_handler_4*/ ctx[23]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$timeSpans, $editIdx, $categories*/ 28) {
    				set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["border-color"]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(108:8) {#if $timeSpans[$editIdx].style['border-color'] !== null}",
    		ctx
    	});

    	return block;
    }

    // (127:8) {:else}
    function create_else_block(ctx) {
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			a.textContent = "Set border width";
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-2szal3");
    			add_location(a, file$1, 127, 10, 4639);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(/*click_handler_7*/ ctx[27]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(127:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (121:8) {#if $timeSpans[$editIdx].style['border-width'] !== null}
    function create_if_block$1(ctx) {
    	let input;
    	let t0;
    	let div;
    	let label;
    	let t2;
    	let a;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			div = element("div");
    			label = element("label");
    			label.textContent = "Border width";
    			t2 = space();
    			a = element("a");
    			a.textContent = "unset";
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "9");
    			attr_dev(input, "id", "b-width");
    			attr_dev(input, "class", "svelte-2szal3");
    			add_location(input, file$1, 121, 10, 4330);
    			attr_dev(label, "for", "b-width");
    			add_location(label, file$1, 123, 12, 4464);
    			attr_dev(a, "href", "#");
    			attr_dev(a, "class", "svelte-2szal3");
    			add_location(a, file$1, 124, 12, 4518);
    			add_location(div, file$1, 122, 10, 4446);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["border-width"]);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(div, t2);
    			append_dev(div, a);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[25]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[25]),
    					listen_dev(a, "click", prevent_default(/*click_handler_6*/ ctx[26]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$timeSpans, $editIdx, $categories*/ 28) {
    				set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["border-width"]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(121:8) {#if $timeSpans[$editIdx].style['border-width'] !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div16;
    	let div0;
    	let t1;
    	let a;
    	let t2;
    	let div3;
    	let div2;
    	let div1;
    	let t4;
    	let datepicker;
    	let updating_dateString;
    	let t5;
    	let div6;
    	let div5;
    	let div4;
    	let t7;
    	let current_block_type_index;
    	let if_block0;
    	let t8;
    	let div15;
    	let div7;
    	let label0;
    	let t10;
    	let input;
    	let t11;
    	let div8;
    	let label1;
    	let t13;
    	let textarea;
    	let t14;
    	let div9;
    	let label2;
    	let t16;
    	let t17;
    	let div14;
    	let div10;
    	let t19;
    	let div11;
    	let t20;
    	let div12;
    	let t21;
    	let div13;
    	let t22;
    	let button;
    	let t23;
    	let button_disabled_value;
    	let current;
    	let mounted;
    	let dispose;

    	function datepicker_dateString_binding(value) {
    		/*datepicker_dateString_binding*/ ctx[11](value);
    	}

    	let datepicker_props = {
    		startYear: parseInt(/*$dobString*/ ctx[5].substr(0, 4))
    	};

    	if (/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].startDate !== void 0) {
    		datepicker_props.dateString = /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].startDate;
    	}

    	datepicker = new DatePicker({ props: datepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(datepicker, "dateString", datepicker_dateString_binding));
    	const if_block_creators = [create_if_block_4, create_else_block_4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].endDate === "ongoing") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*categoryInputType*/ ctx[1] === "select") return create_if_block_3$1;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["background-color"] !== null) return create_if_block_2$1;
    		return create_else_block_2;
    	}

    	let current_block_type_1 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_1(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["border-color"] !== null) return create_if_block_1$1;
    		return create_else_block_1;
    	}

    	let current_block_type_2 = select_block_type_3(ctx);
    	let if_block3 = current_block_type_2(ctx);

    	function select_block_type_4(ctx, dirty) {
    		if (/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].style["border-width"] !== null) return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type_3 = select_block_type_4(ctx);
    	let if_block4 = current_block_type_3(ctx);

    	const block = {
    		c: function create() {
    			div16 = element("div");
    			div0 = element("div");
    			div0.textContent = "Change time span";
    			t1 = space();
    			a = element("a");
    			t2 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div1.textContent = "Start";
    			t4 = space();
    			create_component(datepicker.$$.fragment);
    			t5 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div4.textContent = "End";
    			t7 = space();
    			if_block0.c();
    			t8 = space();
    			div15 = element("div");
    			div7 = element("div");
    			label0 = element("label");
    			label0.textContent = "Name";
    			t10 = space();
    			input = element("input");
    			t11 = space();
    			div8 = element("div");
    			label1 = element("label");
    			label1.textContent = "Description";
    			t13 = space();
    			textarea = element("textarea");
    			t14 = space();
    			div9 = element("div");
    			label2 = element("label");
    			label2.textContent = "Category";
    			t16 = space();
    			if_block1.c();
    			t17 = space();
    			div14 = element("div");
    			div10 = element("div");
    			div10.textContent = "Styling";
    			t19 = space();
    			div11 = element("div");
    			if_block2.c();
    			t20 = space();
    			div12 = element("div");
    			if_block3.c();
    			t21 = space();
    			div13 = element("div");
    			if_block4.c();
    			t22 = space();
    			button = element("button");
    			t23 = text("Save changes");
    			attr_dev(div0, "class", "title svelte-2szal3");
    			add_location(div0, file$1, 46, 2, 1115);
    			attr_dev(a, "class", "close svelte-2szal3");
    			add_location(a, file$1, 48, 2, 1160);
    			attr_dev(div1, "class", "substep-head svelte-2szal3");
    			add_location(div1, file$1, 52, 6, 1272);
    			attr_dev(div2, "class", "substep svelte-2szal3");
    			add_location(div2, file$1, 51, 4, 1244);
    			attr_dev(div3, "class", "step");
    			add_location(div3, file$1, 50, 2, 1221);
    			attr_dev(div4, "class", "substep-head svelte-2szal3");
    			add_location(div4, file$1, 59, 6, 1499);
    			attr_dev(div5, "class", "substep svelte-2szal3");
    			add_location(div5, file$1, 58, 4, 1471);
    			attr_dev(div6, "class", "step");
    			add_location(div6, file$1, 57, 2, 1448);
    			attr_dev(label0, "class", "substep-head svelte-2szal3");
    			attr_dev(label0, "for", "name");
    			add_location(label0, file$1, 71, 6, 2071);
    			attr_dev(input, "id", "name");
    			attr_dev(input, "class", "svelte-2szal3");
    			add_location(input, file$1, 72, 6, 2129);
    			attr_dev(div7, "class", "substep svelte-2szal3");
    			add_location(div7, file$1, 70, 4, 2043);
    			attr_dev(label1, "class", "substep-head svelte-2szal3");
    			attr_dev(label1, "for", "description");
    			add_location(label1, file$1, 75, 6, 2229);
    			attr_dev(textarea, "id", "description");
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "class", "svelte-2szal3");
    			add_location(textarea, file$1, 76, 6, 2301);
    			attr_dev(div8, "class", "substep svelte-2szal3");
    			add_location(div8, file$1, 74, 4, 2201);
    			attr_dev(label2, "class", "substep-head svelte-2szal3");
    			attr_dev(label2, "for", "category");
    			add_location(label2, file$1, 79, 6, 2438);
    			attr_dev(div9, "class", "substep svelte-2szal3");
    			add_location(div9, file$1, 78, 4, 2410);
    			attr_dev(div10, "class", "substep-head svelte-2szal3");
    			add_location(div10, file$1, 92, 6, 3018);
    			attr_dev(div11, "class", "style-row svelte-2szal3");
    			add_location(div11, file$1, 93, 6, 3064);
    			attr_dev(div12, "class", "style-row svelte-2szal3");
    			add_location(div12, file$1, 106, 6, 3660);
    			attr_dev(div13, "class", "style-row svelte-2szal3");
    			add_location(div13, file$1, 119, 6, 4230);
    			attr_dev(div14, "class", "substep svelte-2szal3");
    			add_location(div14, file$1, 91, 4, 2990);
    			attr_dev(button, "class", "create-button svelte-2szal3");
    			button.disabled = button_disabled_value = !/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].name?.trim() || !/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].category?.trim();
    			add_location(button, file$1, 134, 4, 4818);
    			attr_dev(div15, "class", "step");
    			add_location(div15, file$1, 69, 2, 2020);
    			attr_dev(div16, "class", "edit-time-span svelte-2szal3");
    			add_location(div16, file$1, 45, 0, 1084);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div0);
    			append_dev(div16, t1);
    			append_dev(div16, a);
    			a.innerHTML = CloseIcon;
    			append_dev(div16, t2);
    			append_dev(div16, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div2, t4);
    			mount_component(datepicker, div2, null);
    			append_dev(div16, t5);
    			append_dev(div16, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div5, t7);
    			if_blocks[current_block_type_index].m(div5, null);
    			append_dev(div16, t8);
    			append_dev(div16, div15);
    			append_dev(div15, div7);
    			append_dev(div7, label0);
    			append_dev(div7, t10);
    			append_dev(div7, input);
    			set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].name);
    			append_dev(div15, t11);
    			append_dev(div15, div8);
    			append_dev(div8, label1);
    			append_dev(div8, t13);
    			append_dev(div8, textarea);
    			set_input_value(textarea, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].description);
    			append_dev(div15, t14);
    			append_dev(div15, div9);
    			append_dev(div9, label2);
    			append_dev(div9, t16);
    			if_block1.m(div9, null);
    			append_dev(div15, t17);
    			append_dev(div15, div14);
    			append_dev(div14, div10);
    			append_dev(div14, t19);
    			append_dev(div14, div11);
    			if_block2.m(div11, null);
    			append_dev(div14, t20);
    			append_dev(div14, div12);
    			if_block3.m(div12, null);
    			append_dev(div14, t21);
    			append_dev(div14, div13);
    			if_block4.m(div13, null);
    			append_dev(div15, t22);
    			append_dev(div15, button);
    			append_dev(button, t23);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*discard*/ ctx[7], false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[15]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[16]),
    					listen_dev(button, "click", /*saveTimeSpan*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const datepicker_changes = {};
    			if (dirty[0] & /*$dobString*/ 32) datepicker_changes.startYear = parseInt(/*$dobString*/ ctx[5].substr(0, 4));

    			if (!updating_dateString && dirty[0] & /*$timeSpans, $editIdx*/ 12) {
    				updating_dateString = true;
    				datepicker_changes.dateString = /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].startDate;
    				add_flush_callback(() => updating_dateString = false);
    			}

    			datepicker.$set(datepicker_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div5, null);
    			}

    			if (dirty[0] & /*$timeSpans, $editIdx, $categories*/ 28 && input.value !== /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].name) {
    				set_input_value(input, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].name);
    			}

    			if (dirty[0] & /*$timeSpans, $editIdx, $categories*/ 28) {
    				set_input_value(textarea, /*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].description);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div9, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div11, null);
    				}
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_3(ctx)) && if_block3) {
    				if_block3.p(ctx, dirty);
    			} else {
    				if_block3.d(1);
    				if_block3 = current_block_type_2(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(div12, null);
    				}
    			}

    			if (current_block_type_3 === (current_block_type_3 = select_block_type_4(ctx)) && if_block4) {
    				if_block4.p(ctx, dirty);
    			} else {
    				if_block4.d(1);
    				if_block4 = current_block_type_3(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(div13, null);
    				}
    			}

    			if (!current || dirty[0] & /*$timeSpans, $editIdx, $categories*/ 28 && button_disabled_value !== (button_disabled_value = !/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].name?.trim() || !/*$timeSpans*/ ctx[2][/*$editIdx*/ ctx[3]].category?.trim())) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div16);
    			destroy_component(datepicker);
    			if_blocks[current_block_type_index].d();
    			if_block1.d();
    			if_block2.d();
    			if_block3.d();
    			if_block4.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $timeSpans;
    	let $editIdx;
    	let $categories;
    	let $dobString;
    	validate_store(timeSpans, "timeSpans");
    	component_subscribe($$self, timeSpans, $$value => $$invalidate(2, $timeSpans = $$value));
    	validate_store(editIdx, "editIdx");
    	component_subscribe($$self, editIdx, $$value => $$invalidate(3, $editIdx = $$value));
    	validate_store(categories, "categories");
    	component_subscribe($$self, categories, $$value => $$invalidate(4, $categories = $$value));
    	validate_store(dobString, "dobString");
    	component_subscribe($$self, dobString, $$value => $$invalidate(5, $dobString = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("EditTimeSpan", slots, []);
    	let nameInput;
    	let catInput;
    	let categoryInputType = "select";

    	function saveTimeSpan() {
    		save("timeSpans", $timeSpans);
    		set_store_value(editIdx, $editIdx = null, $editIdx);
    	}

    	function discard() {
    		set_store_value(timeSpans, $timeSpans = load("timeSpans"), $timeSpans);
    		set_store_value(editIdx, $editIdx = null, $editIdx);
    	}

    	async function handleCategoryChange(event) {
    		if (event.target.value === "$$createNew") {
    			set_store_value(timeSpans, $timeSpans[$editIdx].category = "", $timeSpans);
    			$$invalidate(1, categoryInputType = "input");
    			await tick();
    			catInput.focus();
    		} else {
    			set_store_value(timeSpans, $timeSpans[$editIdx].category = event.target.value, $timeSpans);
    		}
    	}

    	function handleCatBlur(event) {
    		if (!event.target.value.trim()) {
    			set_store_value(timeSpans, $timeSpans[$editIdx].category = $categories[0], $timeSpans);
    			$$invalidate(1, categoryInputType = "select");
    		}
    	}

    	function setNull(key) {
    		set_store_value(timeSpans, $timeSpans[$editIdx].style[key] = null, $timeSpans);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<EditTimeSpan> was created with unknown prop '${key}'`);
    	});

    	function datepicker_dateString_binding(value) {
    		if ($$self.$$.not_equal($timeSpans[$editIdx].startDate, value)) {
    			$timeSpans[$editIdx].startDate = value;
    			timeSpans.set($timeSpans);
    		}
    	}

    	const click_handler = () => set_store_value(timeSpans, $timeSpans[$editIdx].endDate = today, $timeSpans);

    	function datepicker_dateString_binding_1(value) {
    		if ($$self.$$.not_equal($timeSpans[$editIdx].endDate, value)) {
    			$timeSpans[$editIdx].endDate = value;
    			timeSpans.set($timeSpans);
    		}
    	}

    	const click_handler_1 = () => set_store_value(timeSpans, $timeSpans[$editIdx].endDate = "ongoing", $timeSpans);

    	function input_input_handler() {
    		$timeSpans[$editIdx].name = this.value;
    		timeSpans.set($timeSpans);
    	}

    	function textarea_input_handler() {
    		$timeSpans[$editIdx].description = this.value;
    		timeSpans.set($timeSpans);
    	}

    	function input_input_handler_1() {
    		$timeSpans[$editIdx].category = this.value;
    		timeSpans.set($timeSpans);
    	}

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			catInput = $$value;
    			$$invalidate(0, catInput);
    		});
    	}

    	function input_input_handler_2() {
    		$timeSpans[$editIdx].style["background-color"] = this.value;
    		timeSpans.set($timeSpans);
    	}

    	const click_handler_2 = () => setNull("background-color");
    	const click_handler_3 = () => set_store_value(timeSpans, $timeSpans[$editIdx].style["background-color"] = "#00c3ff", $timeSpans);

    	function input_input_handler_3() {
    		$timeSpans[$editIdx].style["border-color"] = this.value;
    		timeSpans.set($timeSpans);
    	}

    	const click_handler_4 = () => setNull("border-color");
    	const click_handler_5 = () => set_store_value(timeSpans, $timeSpans[$editIdx].style["border-color"] = "#000000", $timeSpans);

    	function input_change_input_handler() {
    		$timeSpans[$editIdx].style["border-width"] = to_number(this.value);
    		timeSpans.set($timeSpans);
    	}

    	const click_handler_6 = () => setNull("border-width");
    	const click_handler_7 = () => set_store_value(timeSpans, $timeSpans[$editIdx].style["border-width"] = 1, $timeSpans);

    	$$self.$capture_state = () => ({
    		tick,
    		timeSpans,
    		editIdx,
    		categories,
    		dobString,
    		save,
    		load,
    		today,
    		CloseIcon,
    		DatePicker,
    		nameInput,
    		catInput,
    		categoryInputType,
    		saveTimeSpan,
    		discard,
    		handleCategoryChange,
    		handleCatBlur,
    		setNull,
    		$timeSpans,
    		$editIdx,
    		$categories,
    		$dobString
    	});

    	$$self.$inject_state = $$props => {
    		if ("nameInput" in $$props) nameInput = $$props.nameInput;
    		if ("catInput" in $$props) $$invalidate(0, catInput = $$props.catInput);
    		if ("categoryInputType" in $$props) $$invalidate(1, categoryInputType = $$props.categoryInputType);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		catInput,
    		categoryInputType,
    		$timeSpans,
    		$editIdx,
    		$categories,
    		$dobString,
    		saveTimeSpan,
    		discard,
    		handleCategoryChange,
    		handleCatBlur,
    		setNull,
    		datepicker_dateString_binding,
    		click_handler,
    		datepicker_dateString_binding_1,
    		click_handler_1,
    		input_input_handler,
    		textarea_input_handler,
    		input_input_handler_1,
    		input_binding,
    		input_input_handler_2,
    		click_handler_2,
    		click_handler_3,
    		input_input_handler_3,
    		click_handler_4,
    		click_handler_5,
    		input_change_input_handler,
    		click_handler_6,
    		click_handler_7
    	];
    }

    class EditTimeSpan extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "EditTimeSpan",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Notices.svelte generated by Svelte v3.38.2 */

    function create_fragment$1(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Notices", slots, []);
    	let hideMobileNotice = load("hideMobileNotice");
    	let hidePrivacyNotice = load("hidePrivacyNotice");
    	let hideUpdatesUntil = load("hideUpdatesUntil");
    	let updateDate = "2021-12-30";
    	let isUpdateVisible = false;

    	function removeMobileNotice() {
    		hideMobileNotice = true;
    		save("hideMobileNotice", true);
    	}

    	function removePrivacyNotice() {
    		hidePrivacyNotice = true;
    		save("hidePrivacyNotice", true);
    	}

    	function hideUpdatesNotice() {
    		isUpdateVisible = false;
    		save("hideUpdatesUntil", updateDate);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notices> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		load,
    		save,
    		hideMobileNotice,
    		hidePrivacyNotice,
    		hideUpdatesUntil,
    		updateDate,
    		isUpdateVisible,
    		removeMobileNotice,
    		removePrivacyNotice,
    		hideUpdatesNotice
    	});

    	$$self.$inject_state = $$props => {
    		if ("hideMobileNotice" in $$props) hideMobileNotice = $$props.hideMobileNotice;
    		if ("hidePrivacyNotice" in $$props) hidePrivacyNotice = $$props.hidePrivacyNotice;
    		if ("hideUpdatesUntil" in $$props) hideUpdatesUntil = $$props.hideUpdatesUntil;
    		if ("updateDate" in $$props) updateDate = $$props.updateDate;
    		if ("isUpdateVisible" in $$props) isUpdateVisible = $$props.isUpdateVisible;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Notices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notices",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.38.2 */
    const file = "src/App.svelte";

    // (45:0) {#if $showSettings}
    function create_if_block_3(ctx) {
    	let settings;
    	let current;
    	settings = new Settings({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(settings.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(settings, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(settings.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(settings.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(settings, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(45:0) {#if $showSettings}",
    		ctx
    	});

    	return block;
    }

    // (49:0) {#if $appMode === 'create-time-span'}
    function create_if_block_2(ctx) {
    	let createtimespan;
    	let current;
    	createtimespan = new CreateTimeSpan({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(createtimespan.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(createtimespan, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(createtimespan.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(createtimespan.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(createtimespan, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(49:0) {#if $appMode === 'create-time-span'}",
    		ctx
    	});

    	return block;
    }

    // (53:0) {#if $appMode === 'edit-time-spans'}
    function create_if_block_1(ctx) {
    	let edittimespans;
    	let current;
    	edittimespans = new EditTimeSpans({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(edittimespans.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(edittimespans, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(edittimespans.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(edittimespans.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(edittimespans, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(53:0) {#if $appMode === 'edit-time-spans'}",
    		ctx
    	});

    	return block;
    }

    // (57:0) {#if $editIdx !== null}
    function create_if_block(ctx) {
    	let edittimespan;
    	let current;
    	edittimespan = new EditTimeSpan({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(edittimespan.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(edittimespan, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(edittimespan.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(edittimespan.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(edittimespan, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(57:0) {#if $editIdx !== null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let p;
    	let t3;
    	let agecalculator;
    	let t4;
    	let dobpicker;
    	let t5;
    	let calendar;
    	let t6;
    	let currentweekdetails;
    	let t7;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let notices;
    	let current;
    	agecalculator = new AgeCalculator({ $$inline: true });
    	dobpicker = new DobPicker({ $$inline: true });
    	calendar = new Calendar({ $$inline: true });
    	currentweekdetails = new CurrentWeekDetails({ $$inline: true });
    	let if_block0 = /*$showSettings*/ ctx[0] && create_if_block_3(ctx);
    	let if_block1 = /*$appMode*/ ctx[1] === "create-time-span" && create_if_block_2(ctx);
    	let if_block2 = /*$appMode*/ ctx[1] === "edit-time-spans" && create_if_block_1(ctx);
    	let if_block3 = /*$editIdx*/ ctx[2] !== null && create_if_block(ctx);
    	notices = new Notices({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "BinLife";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Each circle represents a week in your life";
    			t3 = space();
    			create_component(agecalculator.$$.fragment);
    			t4 = space();
    			create_component(dobpicker.$$.fragment);
    			t5 = space();
    			create_component(calendar.$$.fragment);
    			t6 = space();
    			create_component(currentweekdetails.$$.fragment);
    			t7 = space();
    			if (if_block0) if_block0.c();
    			t8 = space();
    			if (if_block1) if_block1.c();
    			t9 = space();
    			if (if_block2) if_block2.c();
    			t10 = space();
    			if (if_block3) if_block3.c();
    			t11 = space();
    			create_component(notices.$$.fragment);
    			attr_dev(h1, "class", "title svelte-qy7fhv");
    			set_style(h1, "font-weight", "1000");
    			add_location(h1, file, 14, 2, 555);
    			attr_dev(p, "class", "info svelte-qy7fhv");
    			add_location(p, file, 16, 2, 615);
    			attr_dev(main, "class", "svelte-qy7fhv");
    			add_location(main, file, 13, 0, 546);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, p);
    			append_dev(main, t3);
    			mount_component(agecalculator, main, null);
    			append_dev(main, t4);
    			mount_component(dobpicker, main, null);
    			append_dev(main, t5);
    			mount_component(calendar, main, null);
    			insert_dev(target, t6, anchor);
    			mount_component(currentweekdetails, target, anchor);
    			insert_dev(target, t7, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t8, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t9, anchor);
    			if (if_block2) if_block2.m(target, anchor);
    			insert_dev(target, t10, anchor);
    			if (if_block3) if_block3.m(target, anchor);
    			insert_dev(target, t11, anchor);
    			mount_component(notices, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$showSettings*/ ctx[0]) {
    				if (if_block0) {
    					if (dirty & /*$showSettings*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t8.parentNode, t8);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$appMode*/ ctx[1] === "create-time-span") {
    				if (if_block1) {
    					if (dirty & /*$appMode*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t9.parentNode, t9);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$appMode*/ ctx[1] === "edit-time-spans") {
    				if (if_block2) {
    					if (dirty & /*$appMode*/ 2) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(t10.parentNode, t10);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*$editIdx*/ ctx[2] !== null) {
    				if (if_block3) {
    					if (dirty & /*$editIdx*/ 4) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(t11.parentNode, t11);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(agecalculator.$$.fragment, local);
    			transition_in(dobpicker.$$.fragment, local);
    			transition_in(calendar.$$.fragment, local);
    			transition_in(currentweekdetails.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			transition_in(notices.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(agecalculator.$$.fragment, local);
    			transition_out(dobpicker.$$.fragment, local);
    			transition_out(calendar.$$.fragment, local);
    			transition_out(currentweekdetails.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			transition_out(notices.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(agecalculator);
    			destroy_component(dobpicker);
    			destroy_component(calendar);
    			if (detaching) detach_dev(t6);
    			destroy_component(currentweekdetails, detaching);
    			if (detaching) detach_dev(t7);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t8);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t9);
    			if (if_block2) if_block2.d(detaching);
    			if (detaching) detach_dev(t10);
    			if (if_block3) if_block3.d(detaching);
    			if (detaching) detach_dev(t11);
    			destroy_component(notices, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $showSettings;
    	let $appMode;
    	let $editIdx;
    	validate_store(showSettings, "showSettings");
    	component_subscribe($$self, showSettings, $$value => $$invalidate(0, $showSettings = $$value));
    	validate_store(appMode, "appMode");
    	component_subscribe($$self, appMode, $$value => $$invalidate(1, $appMode = $$value));
    	validate_store(editIdx, "editIdx");
    	component_subscribe($$self, editIdx, $$value => $$invalidate(2, $editIdx = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		appMode,
    		timeSpans,
    		showSettings,
    		editIdx,
    		AgeCalculator,
    		DobPicker,
    		CurrentWeekDetails,
    		CreateTimeSpan,
    		Calendar,
    		Settings,
    		EditTimeSpans,
    		EditTimeSpan,
    		Notices,
    		$showSettings,
    		$appMode,
    		$editIdx
    	});

    	return [$showSettings, $appMode, $editIdx];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
