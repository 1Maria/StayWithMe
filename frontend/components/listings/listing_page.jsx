import React, {Component} from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import { fetchListing } from '../../actions/listings'
import { fetchListingReviews } from '../../actions/reviews'
import { createBooking } from '../../actions/bookings'

import Loading from '../misc/loading';
import { isInclusivelyAfterDay, DateRangePicker, DayPickerRangeController } from 'react-dates';
import Review from '../reviews/review';
import ReviewForm from '../reviews/review_form';
import moment from 'moment';
import isEmpty from 'lodash/isEmpty';
import Rating from 'react-rating';
import SmallRating from '../misc/small_ratings';
import { toggleLoginModal, receiveMessages } from '../../actions/ui';


import { AirCon } from '../../static_assets/amenity_icons';

const today = moment();

class Listing extends Component {
  constructor(props) {
    super(props);
    this.state = {
      booking: {
        startDate:null,
        endDate:null,
        calendarFocused: null,
        openGuestSelect: false,
        numGuests: 1,
        focusedInput: null,
        start_date: '',
        end_date: ''
      },
      availCal: {
        startDate:null,
        endDate:null,
        // focusedInput: null,
        // calendarFocused: null,
      }
      
    }
  }

  componentDidMount() {
    const { 
      fetchListing,
      fetchListingReviews, 
    } = this.props;

    document.addEventListener('mousedown', this.handleClickOutsideGuestSelector);
    
    fetchListingReviews(this.props.match.params.id)

    fetchListing(this.props.match.params.id).then(({listing}) => {
      
      //init map
      const mapOptions = {
        center: { lat: listing.lat, lng: listing.lng },
        zoom: 16
      };
      const mapDOMNode = document.getElementById('map')
      this.map = new google.maps.Map(mapDOMNode, mapOptions);
      const blueCircle = new google.maps.Circle({
        strokeColor: 'rgb(161,207,218)',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: 'rgb(161,207,218)',
        fillOpacity: 0.35,
        map: this.map,
        center: mapOptions.center,
        radius: 150
      });
      blueCircle.setMap(this.map);

      //set availability cal state
      this.setState({
        availCal: {
          ...this.state.availCal,
          startDate: moment(listing.start_date),
          endDate: moment(listing.end_date),
        }
      })

    }); 
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutsideGuestSelector)
  }

  onFocusChange = (focusedInput) => {
    console.log(focusedInput);
    this.setState({
      booking: {
        ...this.state.booking,
        // focusedInput: !this.state.focusedInput ? 'startDate' : focusedInput,
        focusedInput
      }
    });
  }

  handleClickOutsideGuestSelector = (event) => {
    if (this.GuestSelectorRef && !this.GuestSelectorRef.contains(event.target)) {
      this.setState({ 
        booking: {
          ...this.state.booking,
          openGuestSelect: false
        }
      }) 
    }
  }

  setGuestSelectorRef = (node) => {
    this.GuestSelectorRef = node;
  }

  handleNumGuestChange(add) {
    let { numGuests } = this.state.booking;
    const {max_guests} = this.props.listing;
    return () => {
      if( numGuests > 0) {
        if(add && numGuests < max_guests) {
          this.setState({
            booking: {
              ...this.state.booking,
              numGuests: ++numGuests
            }
          })
        } else if(numGuests > 1 && !add) {
          this.setState({
            booking: {
              ...this.state.booking,
              numGuests: --numGuests
            }
          })  
        }
      }
    }
  }

  handleBooking = () => {
    const { 
      receiveMessages, 
      toggleLoginModal,
      createBooking, 
      userId 
    } = this.props; 
    
    if(!userId) {
      receiveMessages(["Please log in to make a booking"])
      return toggleLoginModal('login', true)
    }

    const { numGuests, start_date, end_date } = this.state.booking;
    const booking = {
      listing_id: this.props.match.params.id,
      guest_count: numGuests,
      start_date,
      end_date
    }

    return createBooking(booking).then(() => {
      this.props.history.push(`/users/${userId}`)
    });
  }

  render() {
    const { 
      listingLoading, 
      amenities, 
      home_types, 
      booking_errors,
      reviews } = this.props;
    
    if(listingLoading) {
      return <Loading />
    }
    
    const { 
      title, 
      address, 
      price,
      amenity_ids, 
      home_type_id, 
      description,
      id,
      max_guests,
      user_id,
      photos,
      rating,
      review_ids,
      ownerPhotoUrl,
      ownerName
    } = this.props.listing;

    let { 
      numGuests,
      openGuestSelect
    } = this.state.booking;


    const thumbIdx = 1;
    return (
      <>
      <section className="image-header-container flush-top flex-container">
        { photos ? photos.filter((_,idx) => idx === thumbIdx)
            .map((url, idx) => <div className="left-half hero-image grid--50" key={idx} style={{backgroundImage: `url(${url})`}}></div>) :
            <div className="left-half hero-image--dummy grid--50"></div> }
        <div className="right-half grid--50">
          { photos ? photos.filter((_,idx) => idx !== thumbIdx)
            .map((url, idx) => {
              if(idx < 4) {
                return (
                  <div className="square-image grid--50" key={idx} style={{backgroundImage: `url(${url})`}}>
                  </div>
                )
              }
            })
          : null}
        </div>
      </section>
      <section className="content-container--interior-page flex-container">
        <section className="listing-details-container grid--75">
          {Object.values(home_types).filter(ht => ht.id == home_type_id).map(ht => <h6 key={ht.id} className="text--maroon">{ht.name}</h6>)}
          
          <h2>{title} {this.props.userId == user_id && 
            <Link to={`/listings/${id}/edit`} >(<span className="text--teal">Edit Listing</span>)</Link>}
          </h2>

          <div className="profile-thumb-wrapper">
            <div className="profile-thumb" style={{backgroundImage: `url(${ownerPhotoUrl})`}}></div>
            <p className="tiny">{ownerName}</p>
          </div>  
          <p>{address}</p>
          <p>Max Guests: {max_guests}</p>
          <hr className="hr-24"/>
          
          <p>{description}</p>

          
          <hr className="hr-24"/>
          {/* AMENITIES */}

          <div className="amenities">
            <h5>Amenities</h5>
            <ul>
            {Object.values(amenities).filter(a => amenity_ids.includes(a.id)).map(amenity => {
              return <li key={amenity.id}>{amenity.name}</li>
            })}
            </ul>
          </div>

          <hr className="hr-24"/>
          {/* AVAILABILITY */}

          <h5>Availability</h5>
          <DayPickerRangeController
                startDate={this.state.availCal.startDate}
                endDate={this.state.availCal.endDate}
                isOutsideRange={day => isInclusivelyAfterDay(today, day)}
                onOutsideClick={DayPickerRangeController.onOutsideClick}
                numberOfMonths={2}
                onPrevMonthClick={DayPickerRangeController.onPrevMonthClick}
                onNextMonthClick={DayPickerRangeController.onNextMonthClick}
                onDatesChange={({ startDate, endDate }) => this.setState({ 
                  availCal: {
                    ...this.state.availCal,
                    startDate, 
                    endDate
                 } })}
                focusedInput={null} 
                onFocusChange={focusedInput => this.setState({ focusedInput })}
              />

          <hr className="hr-24"/>
          {/* LOCATION */}
          
          <div className="map-wrapper">
            <h5>Location</h5>
            <div id="map" ref={map => this.mapNode = map}></div>
          </div>

          <hr className="hr-24--no-line"/>
          {/* REVIEWS */}

          <div className="flex-container--no-justify rating-container">
          
            { review_ids.length ? 
              <>
              <h3>{review_ids.length} Review{review_ids.length > 1 ? 's' : ''}</h3> 
              <br />
                <Rating 
                  className="read-only-rating"
                  readonly
                  emptySymbol="fa fa-star-o fa-2x"
                  fullSymbol="fa fa-star fa-2x"
                  initialRating={rating}
                />
              </>
              : 
              <h3>No reviews yet</h3>
            }
          
          </div>

          {/* <hr className="hr-24"/> */}
          {/* LEAVE REVIEWS */}
          {this.props.listing.user_id != this.props.userId ? (
          <>
          <section className="reviews-container">
            {!isEmpty(reviews) ? Object.values(reviews).map(review => <Review key={review.id} review={review} />) : null}
          </section>
          <ReviewForm listing_id={id} />
          </>
          ) :
          null

        }
        </section>
        
        <aside className="floating-booking-container">
          <h3 style={{fontSize: '2.2rem'}}>${price} <span className="tiny bold">per night</span></h3>
          <SmallRating listing={this.props.listing} />
          <hr className="hr-16"/>
          <p className="tiny bold">Dates</p>
          <DateRangePicker
                startDate={this.state.booking.startDate}
                startDateId="your_unique_start_date_id" 
                endDate={this.state.booking.endDate}
                endDateId="your_unique_end_date_id" 
                startDatePlaceholderText="Check In"
                endDatePlaceholderText="Check Out"
                isOutsideRange={day => isInclusivelyAfterDay(today, day)}
                enableOutsideDays={false}
                numberOfMonths={1}
                onDatesChange={({ startDate, endDate }) => this.setState({
                    booking: {
                      ...this.state.booking,
                      startDate, 
                      endDate, 
                      start_date: startDate && moment(startDate).format('YYYY-MM-DD HH:mm:00'),
                      end_date: endDate && moment(endDate).format('YYYY-MM-DD HH:mm:00'), 
                    } 
                  })  
                } 
                focusedInput={this.state.booking.focusedInput} 
                onFocusChange={this.onFocusChange} 
              />
              <div 
                className="guest-input-wrapper"
                ref={this.setGuestSelectorRef} >
                
                <p className="tiny bold">Guests</p>
                <input 
                  type="text" 
                  className="text-input"
                  placeholder="1 guest" 
                  value={`${numGuests} guest${numGuests > 1 ? 's' : ''}`} 
                  ref={(input) => this.guestSelect = input}
                  readOnly       
                  onFocus={() => this.setState({
                    booking: {
                      ...this.state.booking,
                      openGuestSelect: !openGuestSelect, 
                      openDatePicker:false
                    }
                  })}
                  />
                {openGuestSelect && 
                <div className='guest-select-container flex-container' >
                  <p>Adults</p>
                  <button className={`button add-subtract sub ${numGuests == 1 ? 'disabled' :''}`} onClick={this.handleNumGuestChange(false)}></button>
                  <span className="guest-count">{numGuests}</span>
                  <button className={`button add-subtract add ${numGuests == max_guests ? 'disabled' :''}`} onClick={this.handleNumGuestChange(true)}></button>
                </div>}
              </div>
              <button className="button--submit" onClick={this.handleBooking}>Book</button>
              { !isEmpty(booking_errors) && (
                <>
                <ul className="session-errors">
                  {booking_errors.map((error, idx) => <li key={idx}>{error}</li>)}
                </ul>
                </>
                ) 
              }
        </aside>
      </section>
        
      </>
    )
  }
}

const msp = (state, props) => ({
  userId: state.session.id,
  listing: state.entities.listings[props.match.params.id],
  listingLoading: state.ui.listingLoading,
  amenities: state.entities.amenities,
  booking_errors: state.errors.booking,
  home_types: state.entities.home_types,
  reviews: state.entities.reviews
})

const mdp = dispatch => ({
  fetchListing: id => dispatch(fetchListing(id)),
  fetchListingReviews: (listingId) => dispatch(fetchListingReviews(listingId)),
  createBooking: (booking) => dispatch(createBooking(booking)),
  toggleLoginModal: (modal, bool) => dispatch(toggleLoginModal(modal,bool)),
  receiveMessages: (messages) => dispatch(receiveMessages(messages))

})

export default withRouter(connect(msp,mdp)(Listing));
